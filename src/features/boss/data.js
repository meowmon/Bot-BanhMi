// Mỗi boss: { name: string, image: string|null, link: string|null, video?: string }
// - image: URL ảnh trực tiếp (jpg/png/gif)
// - link: link boss guide
// - video (tuỳ chọn): link video guide (YouTube...), thêm `video: "https://..."` vào boss cần
// Điền null nếu chưa có thông tin

const bosses = [
  { id: "akechi",        name: "Akechi Mitsuhide",  image: "akechi.png", link: null },
  { id: "baldrix",       name: "Baldrix",           video: "https://www.youtube.com/watch?v=dKcfg00se10",   image: "baldrix.png", link: "https://docs.google.com/document/d/1Pu_Qsd7GcjegfX9v78sIuhoOWacpoh7MgzzhmDE2ngg/edit?usp=sharing" },
  { id: "black-mage",   name: "Black Mage",       video:"https://www.youtube.com/watch?v=SEIXZVqlW3A",    image: "black_mage.png", link: "https://docs.google.com/document/d/1PDIA4OHLNWdVNtpfh7nn24wGKiKNNLmtBiWKRHYmU-U/edit?usp=sharing" },
  { id: "crimson-queen", name: "Crimson Queen",      image: null, link: null },
  { id: "cygnus",        name: "Cygnus",             image: null, link: null },
  { id: "damien",        name: "Damien",             image: null, link: null },
  { id: "darknell",      name: "Darknell",           image: null, link: null },
  { id: "gloom",         name: "Gloom",              image: "gloom.png", link: null },
  { id: "gollux",        name: "Gollux",             image: null, link: null },
  { id: "hilla",         name: "Hilla",              image: null, link: null },
  { id: "kai",        name: "Kai",             image: "kai.png", link: "https://docs.google.com/document/d/1-EGNGurvs9m1K10XyrwNxyyTRs6dUzHrOUXRDOj4pxg/edit?tab=t.0", video : "https://www.youtube.com/watch?v=gNo5JWu6GTE&t=1025s" },
  { id: "kaling",        name: "Kaling",           video: "https://www.youtube.com/watch?v=Aiw-l5e3Yzc",  image: "kaling.png", link: "https://docs.google.com/document/d/1Z_sSCSLkGjTC6-n_l6UdQAROyx6LYAVZk_5WWdF4aj0/edit?usp=sharing" },
  { id: "kalos",         name: "Kalos",           video:"https://www.youtube.com/watch?v=Klg95oTCovc",   image: "kalos.png", link: "https://docs.google.com/document/d/1fyTRDNuo5mdAuFrPRVJKEKjG_SpHAkNjPtrKkx2Ruj0/edit?usp=sharing" },
  { id: "malefic",         name: "Malefic Star",      video: "https://www.youtube.com/watch?v=LB6_QHY36Jc" ,        image: "malefic.png", link: "https://docs.google.com/document/d/1GyC2pgnoCVcpKjrn5WiMyMzPQI6TZY74sHj6xyJMg4o/edit?tab=t.0#heading=h.51vnqb39n258" },
  { id: "limbo",         name: "Limbo",              image: "limbo.png", link: "https://docs.google.com/document/d/12DOhc3jHT7njursPVzhNs19JkJ-Hps-StGrzfvdSenk/edit?usp=sharing" , video: "https://www.youtube.com/watch?v=kwFtqL_TH20" },
  { id: "lotus",         name: "Lotus",              image: null, link: null },
  { id: "lucid",         name: "Lucid",              image: null, link: null },
  { id: "magnus",        name: "Magnus",             image: null, link: null },
  { id: "papulatus",     name: "Papulatus",          image: null, link: null },
  { id: "pierre",        name: "Pierre",             image: null, link: null },
  { id: "pink-bean",     name: "Pink Bean",          image: null, link: null },
  { id: "princess-no",  name: "Princess No",         image: null, link: null },
  { id: "seren",         name: "Seren",              image: "seren.png", link: null },
  { id: "slime",         name: "Slime",            video: "https://www.youtube.com/watch?v=3h9IlWmXvVw",   image: "slime.png", link: "https://docs.google.com/document/d/1HBTlV9UMA6jQTZOK_gjdLENEARniae_IZIQqpdJNqO8/edit?tab=t.0" },
  { id: "the-first-adversary", name: "The First Adversary", image: "adversary.png", link: "https://docs.google.com/document/d/11scfl0CF_Ppo8fM5bz4lEjiQ-ZwwDHANLUzk2PhVLX4/edit?tab=t.0#heading=h.hsk4f1w77tl4", video : "https://www.youtube.com/watch?v=Wqk4Egl-P7c" },
  { id: "verus-hilla",  name: "Verus Hilla",     video: "https://www.youtube.com/watch?v=fZ9NT2NA6VM" ,    image: "vhilla.png", link: "https://docs.google.com/document/d/16-8n4DQSOWkoN4u6CMEw6zP-MRlP0RQsSPmAaIx_vus/edit?tab=t.0" },
  { id: "vellum",        name: "Vellum",             image: null, link: null },
  { id: "von-bon",       name: "Von Bon",            image: null, link: null },
  { id: "will",          name: "Will",         video: "https://www.youtube.com/watch?v=KWNWNJ1izvg",      image: "will.png", link: "https://docs.google.com/document/d/1qR4UIX_q6nUtubkw_p8p7j3e3CefGlJOwcL-rdbC_oo/edit?tab=t.0" },
  { id: "zakum",         name: "Zakum",              image: null, link: null },
  { id: "horntail",      name: "Horntail",           image: null, link: null },
];

module.exports = bosses;
