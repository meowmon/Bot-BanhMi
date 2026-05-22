// Mỗi boss: { name: string, image: string|null, link: string|null }
// - image: URL ảnh trực tiếp (jpg/png/gif)
// - link: link boss guide
// Điền null nếu chưa có thông tin

const bosses = [
  { id: "akechi",        name: "Akechi Mitsuhide",  image: "akechi.png", link: null },
  { id: "baldrix",       name: "Baldrix",            image: "baldrix.png", link: "https://docs.google.com/document/d/1Pu_Qsd7GcjegfX9v78sIuhoOWacpoh7MgzzhmDE2ngg/edit?usp=sharing" },
  { id: "black-mage",   name: "Black Mage",          image: "black_mage.png", link: "https://docs.google.com/document/d/1PDIA4OHLNWdVNtpfh7nn24wGKiKNNLmtBiWKRHYmU-U/edit?usp=sharing" },
  { id: "crimson-queen", name: "Crimson Queen",      image: null, link: null },
  { id: "cygnus",        name: "Cygnus",             image: null, link: null },
  { id: "damien",        name: "Damien",             image: null, link: null },
  { id: "darknell",      name: "Darknell",           image: null, link: null },
  { id: "gloom",         name: "Gloom",              image: "gloom.png", link: null },
  { id: "gollux",        name: "Gollux",             image: null, link: null },
  { id: "hilla",         name: "Hilla",              image: null, link: null },
  { id: "kaling",        name: "Kaling",             image: "kaling.png", link: "https://docs.google.com/document/d/1Z_sSCSLkGjTC6-n_l6UdQAROyx6LYAVZk_5WWdF4aj0/edit?usp=sharing" },
  { id: "kalos",         name: "Kalos",              image: "kalos.png", link: "https://docs.google.com/document/d/1fyTRDNuo5mdAuFrPRVJKEKjG_SpHAkNjPtrKkx2Ruj0/edit?usp=sharing" },
  { id: "limbo",         name: "Limbo",              image: null, link: null },
  { id: "lotus",         name: "Lotus",              image: null, link: null },
  { id: "lucid",         name: "Lucid",              image: null, link: null },
  { id: "magnus",        name: "Magnus",             image: null, link: null },
  { id: "papulatus",     name: "Papulatus",          image: null, link: null },
  { id: "pierre",        name: "Pierre",             image: null, link: null },
  { id: "pink-bean",     name: "Pink Bean",          image: null, link: null },
  { id: "princess-no",  name: "Princess No",         image: null, link: null },
  { id: "ranmaru",       name: "Ranmaru",            image: null, link: null },
  { id: "scarlion",      name: "Scarlion & Targa",   image: null, link: null },
  { id: "seren",         name: "Seren",              image: null, link: null },
  { id: "slime",         name: "Slime",              image: "slime.png", link: "https://docs.google.com/document/d/1HBTlV9UMA6jQTZOK_gjdLENEARniae_IZIQqpdJNqO8/edit?tab=t.0" },
  { id: "the-first-adversary", name: "The First Adversary", image: "adversary.png", link: "https://docs.google.com/document/d/11scfl0CF_Ppo8fM5bz4lEjiQ-ZwwDHANLUzk2PhVLX4/edit?tab=t.0#heading=h.hsk4f1w77tl4" },
  { id: "verus-hilla",  name: "Verus Hilla",         image: "vhilla.png", link: "https://docs.google.com/document/d/16-8n4DQSOWkoN4u6CMEw6zP-MRlP0RQsSPmAaIx_vus/edit?tab=t.0" },
  { id: "vellum",        name: "Vellum",             image: null, link: null },
  { id: "von-bon",       name: "Von Bon",            image: null, link: null },
  { id: "will",          name: "Will",               image: "will.png", link: "https://docs.google.com/document/d/1qR4UIX_q6nUtubkw_p8p7j3e3CefGlJOwcL-rdbC_oo/edit?tab=t.0" },
  { id: "zakum",         name: "Zakum",              image: null, link: null },
  { id: "horntail",      name: "Horntail",           image: null, link: null },
];

module.exports = bosses;
