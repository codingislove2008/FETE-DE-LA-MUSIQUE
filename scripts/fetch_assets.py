import os
import json
import urllib.request
import urllib.parse
from PIL import Image
import io

USER_AGENT = "FeteDeLaMusiqueEducational/1.0 (educational classroom project; contact@example.edu)"

def search_wikimedia(query):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": "5",
        "prop": "imageinfo",
        "iiprop": "url|mime|size|width|height",
        "format": "json"
    }
    url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            for pid, page in pages.items():
                infos = page.get("imageinfo", [])
                if infos:
                    img_url = infos[0]["url"]
                    mime = infos[0].get("mime", "")
                    if ("jpeg" in mime or "png" in mime or "jpg" in mime) and not img_url.endswith(".svg"):
                        return img_url
    except Exception as e:
        print(f"Error searching for {query}: {e}")
    return None

def download_and_optimize(url, out_path, max_dim=(800, 600), quality=82):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
        im = Image.open(io.BytesIO(data))
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.thumbnail(max_dim, Image.Resampling.LANCZOS)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        im.save(out_path, "JPEG", quality=quality, optimize=True)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"Saved {out_path} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"Failed to download/process {url} to {out_path}: {e}")
        return False

# Target lists
cities = [
    ("paris", "Paris Eiffel Tower view"),
    ("lyon", "Lyon Saone Fourviere"),
    ("marseille", "Marseille Vieux Port"),
    ("toulouse", "Toulouse Place du Capitole"),
    ("nantes", "Chateau des ducs de Bretagne Nantes"),
    ("strasbourg", "Strasbourg Petite France"),
    ("brittany", "Rennes Place du Champ Jacquet"),
    ("bordeaux", "Bordeaux Place de la Bourse")
]

musicians = [
    ("adam_de_la_halle", "Adam de la Halle portrait miniature"),
    ("josquin_des_prez", "Josquin des Prez portrait woodcut"),
    ("jean_baptiste_lully", "Jean-Baptiste Lully portrait Paul Mignard"),
    ("hector_berlioz", "Hector Berlioz photo Nadar or Petit"),
    ("edith_piaf", "Edith Piaf portrait 1962"),
    ("charles_trenet", "Charles Trenet portrait"),
    ("hugues_aufray", "Hugues Aufray portrait"),
    ("serge_gainsbourg", "Serge Gainsbourg portrait"),
    ("daft_punk", "Daft Punk helmets music"),
    ("stromae", "Stromae Eurockeennes concert")
]

timeline = [
    ("medieval_troubadours", "Cantigas de Santa Maria medieval musicians"),
    ("renaissance_baroque", "Musiciens cour Versailles Baroque"),
    ("romantic_era", "Hector Berlioz conducting caricature orchestra"),
    ("cabaret_1900", "Moulin Rouge Toulouse Lautrec poster"),
    ("chanson_francaise", "Accordion player Paris street cafe vintage"),
    ("yeye_pop", "Francoise Hardy 1969 portrait"),
    ("french_rock_synth", "Moog modular synthesizer concert vintage"),
    ("french_touch_electro", "Daft Punk Alive 2007 pyramid stage"),
    ("modern_pop_rap", "French hip hop concert crowd stage"),
    ("global_french_era", "Fete de la musique Paris crowd street concert")
]

if __name__ == "__main__":
    os.makedirs("assets/images/cities", exist_ok=True)
    os.makedirs("assets/images/musicians", exist_ok=True)
    os.makedirs("assets/images/timeline", exist_ok=True)

    print("--- Fetching Cities ---")
    for key, q in cities:
        target = f"assets/images/cities/{key}.jpg"
        if not os.path.exists(target):
            u = search_wikimedia(q)
            if u:
                download_and_optimize(u, target, (700, 500))
            else:
                print(f"Could not find {key}")

    print("--- Fetching Musicians ---")
    for key, q in musicians:
        target = f"assets/images/musicians/{key}.jpg"
        if not os.path.exists(target):
            u = search_wikimedia(q)
            if u:
                download_and_optimize(u, target, (500, 600))
            else:
                print(f"Could not find {key}")

    print("--- Fetching Timeline ---")
    for key, q in timeline:
        target = f"assets/images/timeline/{key}.jpg"
        if not os.path.exists(target):
            u = search_wikimedia(q)
            if u:
                download_and_optimize(u, target, (700, 500))
            else:
                print(f"Could not find {key}")
