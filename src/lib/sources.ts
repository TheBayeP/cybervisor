// ---------------------------------------------------------------------------
// CyberVisor -- Cybersecurity RSS Sources Registry
// ---------------------------------------------------------------------------

export interface Source {
  id: string;
  name: string;
  url: string;
  website: string;
  category: "cert" | "news" | "blog" | "vendor" | "government" | "research" | "cve" | "threat-intel";
  country: string;
  language: string;
  priority: number; // 1 = highest
  tags: string[];
}

// ---------------------------------------------------------------------------
// CERT / Government sources (50+)
// ---------------------------------------------------------------------------

const certSources: Source[] = [
  // --- France ---
  { id: "cert-fr", name: "CERT-FR Alertes", url: "https://www.cert.ssi.gouv.fr/alerte/feed/", website: "https://www.cert.ssi.gouv.fr", category: "cert", country: "FR", language: "fr", priority: 1, tags: ["cert", "alerts", "france"] },
  { id: "cert-fr-avis", name: "CERT-FR Avis", url: "https://www.cert.ssi.gouv.fr/avis/feed/", website: "https://www.cert.ssi.gouv.fr", category: "cert", country: "FR", language: "fr", priority: 1, tags: ["cert", "advisories", "france"] },
  { id: "anssi-actualites", name: "ANSSI Actualites", url: "https://www.ssi.gouv.fr/feed/actualite/", website: "https://www.ssi.gouv.fr", category: "government", country: "FR", language: "fr", priority: 1, tags: ["anssi", "government", "france"] },
  { id: "anssi-publications", name: "ANSSI Publications", url: "https://www.ssi.gouv.fr/feed/guide/", website: "https://www.ssi.gouv.fr", category: "government", country: "FR", language: "fr", priority: 2, tags: ["anssi", "guides", "france"] },

  // --- EU ---
  { id: "cert-eu", name: "CERT-EU", url: "https://cert.europa.eu/publications/security-advisories/rss", website: "https://cert.europa.eu", category: "cert", country: "EU", language: "en", priority: 1, tags: ["cert", "eu", "advisories"] },
  { id: "enisa-news", name: "ENISA News", url: "https://www.enisa.europa.eu/rss.xml", website: "https://www.enisa.europa.eu", category: "government", country: "EU", language: "en", priority: 2, tags: ["enisa", "eu", "policy"] },
  { id: "enisa-publications", name: "ENISA Publications", url: "https://www.enisa.europa.eu/publications/rss.xml", website: "https://www.enisa.europa.eu", category: "government", country: "EU", language: "en", priority: 2, tags: ["enisa", "research", "eu"] },

  // --- USA ---
  { id: "cisa-alerts", name: "CISA Alerts", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", website: "https://www.cisa.gov", category: "cert", country: "US", language: "en", priority: 1, tags: ["cisa", "us-cert", "alerts", "usa"] },
  { id: "cisa-ics", name: "CISA ICS Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml", website: "https://www.cisa.gov", category: "cert", country: "US", language: "en", priority: 1, tags: ["cisa", "ics", "scada", "usa"] },
  { id: "cisa-analysis", name: "CISA Analysis Reports", url: "https://www.cisa.gov/cybersecurity-advisories/aa.xml", website: "https://www.cisa.gov", category: "cert", country: "US", language: "en", priority: 1, tags: ["cisa", "analysis", "usa"] },
  { id: "us-cert-current", name: "US-CERT Current Activity", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/rss.xml", website: "https://www.cisa.gov", category: "cert", country: "US", language: "en", priority: 1, tags: ["us-cert", "activity", "usa"] },

  // --- UK ---
  { id: "ncsc-uk", name: "NCSC UK", url: "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml", website: "https://www.ncsc.gov.uk", category: "cert", country: "GB", language: "en", priority: 1, tags: ["ncsc", "uk", "advisories"] },
  { id: "ncsc-uk-news", name: "NCSC UK News", url: "https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml", website: "https://www.ncsc.gov.uk", category: "government", country: "GB", language: "en", priority: 2, tags: ["ncsc", "uk", "news"] },
  { id: "ncsc-uk-reports", name: "NCSC UK Reports", url: "https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml", website: "https://www.ncsc.gov.uk", category: "government", country: "GB", language: "en", priority: 2, tags: ["ncsc", "uk", "reports"] },

  // --- Germany ---
  { id: "bsi-advisories", name: "BSI Advisories", url: "https://www.bsi.bund.de/SiteGlobals/Functions/RSSFeed/RSSNewsfeed/RSSNewsfeed.xml", website: "https://www.bsi.bund.de", category: "cert", country: "DE", language: "de", priority: 1, tags: ["bsi", "germany", "advisories"] },
  { id: "cert-bund", name: "CERT-Bund", url: "https://www.bsi.bund.de/SiteGlobals/Functions/RSSFeed/RSSNewsfeed/RSSBuerger.xml", website: "https://www.bsi.bund.de", category: "cert", country: "DE", language: "de", priority: 1, tags: ["cert-bund", "germany"] },

  // --- Belgium ---
  { id: "cert-be", name: "CERT-BE", url: "https://cert.be/en/rss.xml", website: "https://cert.be", category: "cert", country: "BE", language: "en", priority: 2, tags: ["cert", "belgium"] },
  { id: "ccb-belgium", name: "CCB Belgium", url: "https://ccb.belgium.be/en/rss.xml", website: "https://ccb.belgium.be", category: "government", country: "BE", language: "en", priority: 2, tags: ["ccb", "belgium", "government"] },

  // --- Netherlands ---
  { id: "ncsc-nl", name: "NCSC Netherlands", url: "https://advisories.ncsc.nl/rss/advisories", website: "https://www.ncsc.nl", category: "cert", country: "NL", language: "en", priority: 1, tags: ["ncsc", "netherlands", "advisories"] },
  { id: "ncsc-nl-news", name: "NCSC-NL News", url: "https://www.ncsc.nl/rss/nieuws", website: "https://www.ncsc.nl", category: "government", country: "NL", language: "nl", priority: 2, tags: ["ncsc", "netherlands", "news"] },

  // --- Switzerland ---
  { id: "ncsc-ch", name: "NCSC Switzerland", url: "https://www.ncsc.admin.ch/ncsc/en/home/aktuell/rss.rss", website: "https://www.ncsc.admin.ch", category: "cert", country: "CH", language: "en", priority: 2, tags: ["ncsc", "switzerland"] },
  { id: "cert-ch", name: "CERT-CH", url: "https://www.govcert.ch/blog/rss.xml", website: "https://www.govcert.ch", category: "cert", country: "CH", language: "en", priority: 2, tags: ["cert", "switzerland"] },

  // --- Austria ---
  { id: "cert-at", name: "CERT.at", url: "https://cert.at/cert-at.en.blog.rss_2.0.xml", website: "https://cert.at", category: "cert", country: "AT", language: "en", priority: 2, tags: ["cert", "austria"] },
  { id: "cert-at-warnings", name: "CERT.at Warnings", url: "https://cert.at/cert-at.en.warnings.rss_2.0.xml", website: "https://cert.at", category: "cert", country: "AT", language: "en", priority: 2, tags: ["cert", "austria", "warnings"] },

  // --- Sweden ---
  { id: "cert-se", name: "CERT-SE", url: "https://www.cert.se/feed.rss", website: "https://www.cert.se", category: "cert", country: "SE", language: "sv", priority: 2, tags: ["cert", "sweden"] },

  // --- Finland ---
  { id: "ncsc-fi", name: "NCSC-FI", url: "https://www.kyberturvallisuuskeskus.fi/en/rss/news", website: "https://www.kyberturvallisuuskeskus.fi", category: "cert", country: "FI", language: "en", priority: 2, tags: ["ncsc", "finland"] },

  // --- Norway ---
  { id: "ncsc-no", name: "NCSC Norway", url: "https://nsm.no/aktuelt/rss/", website: "https://nsm.no", category: "cert", country: "NO", language: "no", priority: 2, tags: ["ncsc", "norway"] },

  // --- Denmark ---
  { id: "cfcs-dk", name: "CFCS Denmark", url: "https://www.cfcs.dk/da/nyheder/rss/", website: "https://www.cfcs.dk", category: "cert", country: "DK", language: "da", priority: 2, tags: ["cfcs", "denmark"] },

  // --- Poland ---
  { id: "cert-pl", name: "CERT-PL", url: "https://cert.pl/en/rss.xml", website: "https://cert.pl", category: "cert", country: "PL", language: "en", priority: 2, tags: ["cert", "poland"] },
  { id: "cert-pl-news", name: "CERT-PL News", url: "https://cert.pl/en/posts/rss/", website: "https://cert.pl", category: "cert", country: "PL", language: "en", priority: 2, tags: ["cert", "poland", "news"] },

  // --- Ukraine ---
  { id: "cert-ua", name: "CERT-UA", url: "https://cert.gov.ua/api/articles/rss", website: "https://cert.gov.ua", category: "cert", country: "UA", language: "uk", priority: 1, tags: ["cert", "ukraine"] },

  // --- Estonia ---
  { id: "cert-ee", name: "CERT-EE", url: "https://www.ria.ee/en/rss.xml", website: "https://www.ria.ee", category: "cert", country: "EE", language: "en", priority: 2, tags: ["cert", "estonia"] },

  // --- Italy ---
  { id: "csirt-ita", name: "CSIRT Italia", url: "https://www.csirt.gov.it/feed/rss", website: "https://www.csirt.gov.it", category: "cert", country: "IT", language: "it", priority: 2, tags: ["csirt", "italy"] },

  // --- Spain ---
  { id: "incibe", name: "INCIBE-CERT", url: "https://www.incibe.es/incibe-cert/alerta-temprana/avisos/rss", website: "https://www.incibe.es", category: "cert", country: "ES", language: "es", priority: 2, tags: ["incibe", "spain"] },

  // --- Portugal ---
  { id: "cncs-pt", name: "CNCS Portugal", url: "https://www.cncs.gov.pt/feed/", website: "https://www.cncs.gov.pt", category: "cert", country: "PT", language: "pt", priority: 3, tags: ["cncs", "portugal"] },

  // --- Japan ---
  { id: "jpcert", name: "JPCERT/CC", url: "https://www.jpcert.or.jp/english/rss/jpcert-en.rdf", website: "https://www.jpcert.or.jp", category: "cert", country: "JP", language: "en", priority: 1, tags: ["jpcert", "japan"] },
  { id: "jpcert-alerts", name: "JPCERT Alerts", url: "https://www.jpcert.or.jp/english/at/rss.xml", website: "https://www.jpcert.or.jp", category: "cert", country: "JP", language: "en", priority: 1, tags: ["jpcert", "japan", "alerts"] },

  // --- South Korea ---
  { id: "krcert", name: "KrCERT/CC", url: "https://www.boho.or.kr/data/secNoticeRss.do", website: "https://www.boho.or.kr", category: "cert", country: "KR", language: "ko", priority: 2, tags: ["krcert", "korea"] },

  // --- India ---
  { id: "cert-in", name: "CERT-In", url: "https://www.cert-in.org.in/Rss.jsp", website: "https://www.cert-in.org.in", category: "cert", country: "IN", language: "en", priority: 2, tags: ["cert-in", "india"] },

  // --- Singapore ---
  { id: "singcert", name: "SingCERT", url: "https://www.csa.gov.sg/feeds/singcert-alerts-and-advisories", website: "https://www.csa.gov.sg", category: "cert", country: "SG", language: "en", priority: 2, tags: ["singcert", "singapore"] },

  // --- Australia ---
  { id: "auscert", name: "AusCERT", url: "https://www.auscert.org.au/rss/bulletins/", website: "https://www.auscert.org.au", category: "cert", country: "AU", language: "en", priority: 2, tags: ["auscert", "australia"] },
  { id: "acsc", name: "ACSC Australia", url: "https://www.cyber.gov.au/rss.xml", website: "https://www.cyber.gov.au", category: "government", country: "AU", language: "en", priority: 2, tags: ["acsc", "australia", "government"] },

  // --- New Zealand ---
  { id: "cert-nz", name: "CERT NZ", url: "https://www.cert.govt.nz/rss/feed.xml", website: "https://www.cert.govt.nz", category: "cert", country: "NZ", language: "en", priority: 2, tags: ["cert", "new-zealand"] },

  // --- Canada ---
  { id: "cccs", name: "Canadian Centre for Cyber Security", url: "https://www.cyber.gc.ca/api/cccs/rss", website: "https://www.cyber.gc.ca", category: "cert", country: "CA", language: "en", priority: 2, tags: ["cccs", "canada"] },

  // --- Brazil ---
  { id: "cert-br", name: "CERT.br", url: "https://www.cert.br/rss/certbr-rss.xml", website: "https://www.cert.br", category: "cert", country: "BR", language: "pt", priority: 2, tags: ["cert", "brazil"] },

  // --- International ---
  { id: "first-org", name: "FIRST.org", url: "https://www.first.org/news/rss", website: "https://www.first.org", category: "cert", country: "INTL", language: "en", priority: 2, tags: ["first", "international", "coordination"] },
  { id: "first-blog", name: "FIRST Blog", url: "https://www.first.org/blog/rss", website: "https://www.first.org", category: "cert", country: "INTL", language: "en", priority: 3, tags: ["first", "blog"] },

  // --- Czech Republic ---
  { id: "csirt-cz", name: "CSIRT.CZ", url: "https://csirt.cz/en/rss/", website: "https://csirt.cz", category: "cert", country: "CZ", language: "en", priority: 3, tags: ["csirt", "czech"] },

  // --- Luxembourg ---
  { id: "circl-lu", name: "CIRCL Luxembourg", url: "https://www.circl.lu/pub/feed.xml", website: "https://www.circl.lu", category: "cert", country: "LU", language: "en", priority: 2, tags: ["circl", "luxembourg"] },

  // --- Romania ---
  { id: "cert-ro", name: "CERT-RO", url: "https://cert.ro/feed", website: "https://cert.ro", category: "cert", country: "RO", language: "ro", priority: 3, tags: ["cert", "romania"] },

  // --- Greece ---
  { id: "cert-gr", name: "National CERT Greece", url: "https://www.cert.gr/feed/", website: "https://www.cert.gr", category: "cert", country: "GR", language: "el", priority: 3, tags: ["cert", "greece"] },

  // --- Ireland ---
  { id: "ncsc-ie", name: "NCSC Ireland", url: "https://www.ncsc.gov.ie/news/rss.php", website: "https://www.ncsc.gov.ie", category: "cert", country: "IE", language: "en", priority: 3, tags: ["ncsc", "ireland"] },
];

// ---------------------------------------------------------------------------
// News & Blogs (80+)
// ---------------------------------------------------------------------------

const newsSources: Source[] = [
  // --- French language ---
  { id: "it-connect", name: "IT-Connect", url: "https://www.it-connect.fr/feed/", website: "https://www.it-connect.fr", category: "news", country: "FR", language: "fr", priority: 1, tags: ["news", "tutorials", "france"] },
  { id: "le-monde-informatique", name: "Le Monde Informatique", url: "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml", website: "https://www.lemondeinformatique.fr", category: "news", country: "FR", language: "fr", priority: 1, tags: ["news", "france", "enterprise"] },
  { id: "lemagit-securite", name: "LeMagIT Securite", url: "https://www.lemagit.fr/rss/ContentSyndication.xml", website: "https://www.lemagit.fr", category: "news", country: "FR", language: "fr", priority: 1, tags: ["news", "france", "enterprise"] },
  { id: "globalsecuritymag", name: "Global Security Mag", url: "https://www.globalsecuritymag.fr/rss/", website: "https://www.globalsecuritymag.fr", category: "news", country: "FR", language: "fr", priority: 2, tags: ["news", "france", "magazine"] },
  { id: "zataz", name: "ZATAZ", url: "https://www.zataz.com/feed/", website: "https://www.zataz.com", category: "news", country: "FR", language: "fr", priority: 1, tags: ["news", "france", "breaches", "cybercrime"] },
  { id: "undernews", name: "UnderNews", url: "https://www.undernews.fr/feed", website: "https://www.undernews.fr", category: "news", country: "FR", language: "fr", priority: 2, tags: ["news", "france", "hacking"] },
  { id: "korben", name: "Korben", url: "https://korben.info/feed", website: "https://korben.info", category: "blog", country: "FR", language: "fr", priority: 2, tags: ["blog", "france", "tech", "security"] },
  { id: "silicon-fr", name: "Silicon FR", url: "https://www.silicon.fr/feed", website: "https://www.silicon.fr", category: "news", country: "FR", language: "fr", priority: 2, tags: ["news", "france", "tech"] },
  { id: "next-ink", name: "Next INpact", url: "https://www.next.ink/feed/atom", website: "https://www.next.ink", category: "news", country: "FR", language: "fr", priority: 2, tags: ["news", "france", "tech"] },
  { id: "linformaticien", name: "L'Informaticien", url: "https://www.linformaticien.com/feed/", website: "https://www.linformaticien.com", category: "news", country: "FR", language: "fr", priority: 3, tags: ["news", "france"] },
  { id: "cyber-malveillance-fr", name: "Cybermalveillance.gouv.fr", url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/rss.xml", website: "https://www.cybermalveillance.gouv.fr", category: "government", country: "FR", language: "fr", priority: 1, tags: ["government", "france", "awareness"] },
  { id: "dsih", name: "DSIH", url: "https://www.dsih.fr/rss.php", website: "https://www.dsih.fr", category: "news", country: "FR", language: "fr", priority: 3, tags: ["news", "france", "health-it"] },
  { id: "solutions-numeriques", name: "Solutions Numeriques", url: "https://www.solutions-numeriques.com/feed/", website: "https://www.solutions-numeriques.com", category: "news", country: "FR", language: "fr", priority: 3, tags: ["news", "france", "enterprise"] },

  // --- English major outlets ---
  { id: "the-hacker-news", name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", website: "https://thehackernews.com", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "hacking", "vulnerabilities"] },
  { id: "bleepingcomputer", name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", website: "https://www.bleepingcomputer.com", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "malware", "vulnerabilities"] },
  { id: "krebs-on-security", name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", website: "https://krebsonsecurity.com", category: "blog", country: "US", language: "en", priority: 1, tags: ["blog", "investigative", "cybercrime"] },
  { id: "dark-reading", name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", website: "https://www.darkreading.com", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "enterprise", "analysis"] },
  { id: "securityweek", name: "SecurityWeek", url: "https://www.securityweek.com/feed/", website: "https://www.securityweek.com", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "enterprise", "vulnerabilities"] },
  { id: "threatpost", name: "Threatpost", url: "https://threatpost.com/feed/", website: "https://threatpost.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "threats", "vulnerabilities"] },
  { id: "sc-magazine", name: "SC Magazine", url: "https://www.scmagazine.com/feed", website: "https://www.scmagazine.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "magazine", "enterprise"] },
  { id: "infosecurity-magazine", name: "Infosecurity Magazine", url: "https://www.infosecurity-magazine.com/rss/news/", website: "https://www.infosecurity-magazine.com", category: "news", country: "GB", language: "en", priority: 1, tags: ["news", "magazine", "uk"] },
  { id: "cyberscoop", name: "CyberScoop", url: "https://cyberscoop.com/feed/", website: "https://cyberscoop.com", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "policy", "government"] },
  { id: "the-record", name: "The Record", url: "https://therecord.media/feed/", website: "https://therecord.media", category: "news", country: "US", language: "en", priority: 1, tags: ["news", "investigative", "nation-state"] },
  { id: "security-affairs", name: "Security Affairs", url: "https://securityaffairs.com/feed", website: "https://securityaffairs.com", category: "blog", country: "IT", language: "en", priority: 1, tags: ["blog", "news", "hacking"] },
  { id: "sans-isc", name: "SANS ISC", url: "https://isc.sans.edu/rssfeed.xml", website: "https://isc.sans.edu", category: "blog", country: "US", language: "en", priority: 1, tags: ["sans", "isc", "diary", "analysis"] },
  { id: "sans-isc-podcast", name: "SANS ISC Podcast", url: "https://isc.sans.edu/podcastfeed.xml", website: "https://isc.sans.edu", category: "blog", country: "US", language: "en", priority: 3, tags: ["sans", "podcast"] },
  { id: "schneier-security", name: "Schneier on Security", url: "https://www.schneier.com/feed/", website: "https://www.schneier.com", category: "blog", country: "US", language: "en", priority: 1, tags: ["blog", "cryptography", "opinion"] },
  { id: "graham-cluley", name: "Graham Cluley", url: "https://grahamcluley.com/feed/", website: "https://grahamcluley.com", category: "blog", country: "GB", language: "en", priority: 2, tags: ["blog", "uk", "commentary"] },
  { id: "troy-hunt", name: "Troy Hunt", url: "https://www.troyhunt.com/rss/", website: "https://www.troyhunt.com", category: "blog", country: "AU", language: "en", priority: 2, tags: ["blog", "breaches", "haveibeenpwned"] },
  { id: "hackread", name: "HackRead", url: "https://www.hackread.com/feed/", website: "https://www.hackread.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "hacking", "data-breaches"] },
  { id: "cso-online", name: "CSO Online", url: "https://www.csoonline.com/feed/", website: "https://www.csoonline.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "enterprise", "ciso"] },
  { id: "helpnetsecurity", name: "Help Net Security", url: "https://www.helpnetsecurity.com/feed/", website: "https://www.helpnetsecurity.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "reviews", "analysis"] },
  { id: "cybersecurity-news", name: "Cybersecurity News", url: "https://cybersecuritynews.com/feed/", website: "https://cybersecuritynews.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "vulnerabilities"] },
  { id: "securitynewswire", name: "SecurityBrief", url: "https://securitybrief.co.nz/rss/feed", website: "https://securitybrief.co.nz", category: "news", country: "NZ", language: "en", priority: 3, tags: ["news", "apac"] },
  { id: "thales-blog", name: "Thales Security Blog", url: "https://cpl.thalesgroup.com/blog/feed", website: "https://cpl.thalesgroup.com", category: "blog", country: "FR", language: "en", priority: 2, tags: ["blog", "encryption", "vendor"] },

  // --- German language ---
  { id: "heise-security", name: "Heise Security", url: "https://www.heise.de/security/rss/alert-news-atom.xml", website: "https://www.heise.de/security", category: "news", country: "DE", language: "de", priority: 1, tags: ["news", "germany", "vulnerabilities"] },
  { id: "golem-security", name: "Golem.de Security", url: "https://rss.golem.de/rss.php?tp=sec&feed=RSS2.0", website: "https://www.golem.de", category: "news", country: "DE", language: "de", priority: 2, tags: ["news", "germany", "tech"] },
  { id: "borncity", name: "Borns IT und Windows Blog", url: "https://www.borncity.com/blog/feed/", website: "https://www.borncity.com", category: "blog", country: "DE", language: "de", priority: 2, tags: ["blog", "germany", "windows"] },

  // --- More international English blogs ---
  { id: "daniel-miessler", name: "Daniel Miessler", url: "https://danielmiessler.com/feed/", website: "https://danielmiessler.com", category: "blog", country: "US", language: "en", priority: 2, tags: ["blog", "analysis", "philosophy"] },
  { id: "nakedsecurity-sophos", name: "Sophos Naked Security", url: "https://nakedsecurity.sophos.com/feed/", website: "https://nakedsecurity.sophos.com", category: "blog", country: "GB", language: "en", priority: 1, tags: ["blog", "vendor", "malware"] },
  { id: "taosecurity", name: "TaoSecurity", url: "https://taosecurity.blogspot.com/feeds/posts/default?alt=rss", website: "https://taosecurity.blogspot.com", category: "blog", country: "US", language: "en", priority: 3, tags: ["blog", "network-security", "monitoring"] },
  { id: "packet-storm", name: "Packet Storm", url: "https://packetstormsecurity.com/feeds/", website: "https://packetstormsecurity.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "exploits", "advisories"] },
  { id: "threatconnect-blog", name: "ThreatConnect Blog", url: "https://threatconnect.com/blog/feed/", website: "https://threatconnect.com", category: "blog", country: "US", language: "en", priority: 3, tags: ["blog", "threat-intel", "vendor"] },
  { id: "lawfare-blog", name: "Lawfare Cyber", url: "https://www.lawfaremedia.org/rss.xml", website: "https://www.lawfaremedia.org", category: "blog", country: "US", language: "en", priority: 3, tags: ["blog", "law", "policy", "cyber"] },
  { id: "databreaches-net", name: "DataBreaches.net", url: "https://databreaches.net/feed/", website: "https://databreaches.net", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "breaches", "privacy"] },
  { id: "wired-security", name: "WIRED Security", url: "https://www.wired.com/feed/category/security/latest/rss", website: "https://www.wired.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "mainstream", "investigations"] },
  { id: "ars-security", name: "Ars Technica Security", url: "https://feeds.arstechnica.com/arstechnica/security", website: "https://arstechnica.com", category: "news", country: "US", language: "en", priority: 2, tags: ["news", "tech", "analysis"] },
  { id: "vice-motherboard", name: "VICE Motherboard", url: "https://www.vice.com/en/rss/topic/hacking", website: "https://www.vice.com", category: "news", country: "US", language: "en", priority: 3, tags: ["news", "hacking", "investigation"] },
  { id: "threatpost-podcasts", name: "Threatpost Podcasts", url: "https://threatpost.com/feed/podcast/", website: "https://threatpost.com", category: "news", country: "US", language: "en", priority: 3, tags: ["podcast", "news"] },
  { id: "risky-biz", name: "Risky Business", url: "https://risky.biz/feeds/risky-business/", website: "https://risky.biz", category: "news", country: "AU", language: "en", priority: 2, tags: ["podcast", "news", "analysis"] },
];

// ---------------------------------------------------------------------------
// Vendor / Security Company Blogs (40+)
// ---------------------------------------------------------------------------

const vendorSources: Source[] = [
  // --- Endpoint / AV / EDR ---
  { id: "kaspersky-securelist", name: "Kaspersky Securelist", url: "https://securelist.com/feed/", website: "https://securelist.com", category: "vendor", country: "INTL", language: "en", priority: 1, tags: ["vendor", "apt", "malware", "research"] },
  { id: "sophos-news", name: "Sophos News", url: "https://news.sophos.com/en-us/feed/", website: "https://news.sophos.com", category: "vendor", country: "GB", language: "en", priority: 2, tags: ["vendor", "malware", "ransomware"] },
  { id: "eset-welivesecurity", name: "ESET WeLiveSecurity", url: "https://www.welivesecurity.com/en/rss/feed/", website: "https://www.welivesecurity.com", category: "vendor", country: "SK", language: "en", priority: 1, tags: ["vendor", "malware", "research"] },
  { id: "malwarebytes-labs", name: "Malwarebytes Labs", url: "https://www.malwarebytes.com/blog/feed/index.xml", website: "https://www.malwarebytes.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "malware", "threats"] },
  { id: "trendmicro-research", name: "Trend Micro Research", url: "https://www.trendmicro.com/en_us/research.rss.html", website: "https://www.trendmicro.com", category: "vendor", country: "JP", language: "en", priority: 1, tags: ["vendor", "apt", "research"] },
  { id: "symantec-threat", name: "Symantec Threat Intel", url: "https://symantec-enterprise-blogs.security.com/blogs/threat-intelligence/rss.xml", website: "https://symantec-enterprise-blogs.security.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "apt", "threat-intel"] },
  { id: "bitdefender-labs", name: "Bitdefender Labs", url: "https://www.bitdefender.com/blog/labs/feed/", website: "https://www.bitdefender.com", category: "vendor", country: "RO", language: "en", priority: 2, tags: ["vendor", "malware"] },
  { id: "avast-decoded", name: "Avast Decoded", url: "https://decoded.avast.io/feed/", website: "https://decoded.avast.io", category: "vendor", country: "CZ", language: "en", priority: 2, tags: ["vendor", "malware", "research"] },

  // --- Network / Firewall / UTM ---
  { id: "checkpoint-research", name: "Check Point Research", url: "https://research.checkpoint.com/feed/", website: "https://research.checkpoint.com", category: "vendor", country: "IL", language: "en", priority: 1, tags: ["vendor", "research", "vulnerabilities"] },
  { id: "fortinet-blog", name: "Fortinet Blog", url: "https://www.fortinet.com/blog/feed", website: "https://www.fortinet.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "network", "threats"] },
  { id: "paloalto-unit42", name: "Palo Alto Unit42", url: "https://unit42.paloaltonetworks.com/feed/", website: "https://unit42.paloaltonetworks.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "apt", "threat-intel", "research"] },
  { id: "cisco-talos", name: "Cisco Talos", url: "https://blog.talosintelligence.com/feeds/posts/default?alt=rss", website: "https://blog.talosintelligence.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "threats", "vulnerabilities"] },
  { id: "juniper-threat", name: "Juniper Threat Labs", url: "https://blogs.juniper.net/en-us/threat-research/feed", website: "https://blogs.juniper.net", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "network", "threats"] },
  { id: "watchguard-secplicity", name: "WatchGuard Secplicity", url: "https://www.secplicity.org/feed/", website: "https://www.secplicity.org", category: "vendor", country: "US", language: "en", priority: 3, tags: ["vendor", "network"] },
  { id: "barracuda-blog", name: "Barracuda Blog", url: "https://blog.barracuda.com/feed/", website: "https://blog.barracuda.com", category: "vendor", country: "US", language: "en", priority: 3, tags: ["vendor", "email-security"] },

  // --- Cloud / XDR / Detection ---
  { id: "crowdstrike-blog", name: "CrowdStrike Blog", url: "https://www.crowdstrike.com/blog/feed/", website: "https://www.crowdstrike.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "edr", "threat-intel"] },
  { id: "mandiant-blog", name: "Mandiant Blog", url: "https://www.mandiant.com/resources/blog/rss.xml", website: "https://www.mandiant.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "apt", "incident-response"] },
  { id: "microsoft-security", name: "Microsoft Security Blog", url: "https://www.microsoft.com/en-us/security/blog/feed/", website: "https://www.microsoft.com/security/blog", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "microsoft", "windows", "cloud"] },
  { id: "microsoft-msrc", name: "Microsoft MSRC", url: "https://msrc.microsoft.com/blog/feed/", website: "https://msrc.microsoft.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "microsoft", "patches", "vulnerabilities"] },
  { id: "google-threat", name: "Google Threat Analysis", url: "https://blog.google/threat-analysis-group/rss/", website: "https://blog.google", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "google", "apt"] },
  { id: "google-project-zero", name: "Google Project Zero", url: "https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss", website: "https://googleprojectzero.blogspot.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "zero-day", "research"] },
  { id: "sentinelone-labs", name: "SentinelOne Labs", url: "https://www.sentinelone.com/labs/feed/", website: "https://www.sentinelone.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "edr", "malware"] },
  { id: "elastic-security", name: "Elastic Security Labs", url: "https://www.elastic.co/security-labs/rss/feed.xml", website: "https://www.elastic.co/security-labs", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "detection", "siem"] },

  // --- Vulnerability management ---
  { id: "qualys-blog", name: "Qualys Blog", url: "https://blog.qualys.com/feed", website: "https://blog.qualys.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "vulnerabilities", "compliance"] },
  { id: "tenable-blog", name: "Tenable Blog", url: "https://www.tenable.com/blog/feed", website: "https://www.tenable.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "vulnerabilities", "exposure"] },
  { id: "rapid7-blog", name: "Rapid7 Blog", url: "https://blog.rapid7.com/rss/", website: "https://blog.rapid7.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "metasploit", "vulnerabilities"] },

  // --- Email / Identity ---
  { id: "proofpoint-blog", name: "Proofpoint Blog", url: "https://www.proofpoint.com/us/blog/rss.xml", website: "https://www.proofpoint.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "phishing", "email-security"] },
  { id: "mimecast-blog", name: "Mimecast Blog", url: "https://www.mimecast.com/blog/feed/", website: "https://www.mimecast.com", category: "vendor", country: "GB", language: "en", priority: 3, tags: ["vendor", "email-security"] },

  // --- SIEM / SOAR / Observability ---
  { id: "splunk-security", name: "Splunk Security Blog", url: "https://www.splunk.com/en_us/blog/security.rss", website: "https://www.splunk.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "siem", "detection"] },

  // --- DDoS / CDN / WAF ---
  { id: "cloudflare-blog", name: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/", website: "https://blog.cloudflare.com", category: "vendor", country: "US", language: "en", priority: 1, tags: ["vendor", "ddos", "cdn", "waf"] },
  { id: "akamai-blog", name: "Akamai Security Blog", url: "https://www.akamai.com/blog/security/feed", website: "https://www.akamai.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "ddos", "cdn", "waf"] },

  // --- OT / ICS ---
  { id: "dragos-blog", name: "Dragos Blog", url: "https://www.dragos.com/blog/feed/", website: "https://www.dragos.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "ics", "ot", "scada"] },
  { id: "claroty-blog", name: "Claroty Blog", url: "https://claroty.com/blog/feed", website: "https://claroty.com", category: "vendor", country: "US", language: "en", priority: 2, tags: ["vendor", "ics", "ot"] },
  { id: "nozomi-blog", name: "Nozomi Networks Blog", url: "https://www.nozominetworks.com/blog/rss/", website: "https://www.nozominetworks.com", category: "vendor", country: "US", language: "en", priority: 3, tags: ["vendor", "ics", "ot"] },

  // --- French vendors ---
  { id: "sekoia-blog", name: "Sekoia Blog", url: "https://blog.sekoia.io/feed/", website: "https://blog.sekoia.io", category: "vendor", country: "FR", language: "en", priority: 1, tags: ["vendor", "threat-intel", "france"] },
  { id: "orangecyberdefense", name: "Orange Cyberdefense Blog", url: "https://www.orangecyberdefense.com/global/blog/feed/", website: "https://www.orangecyberdefense.com", category: "vendor", country: "FR", language: "en", priority: 1, tags: ["vendor", "threat-intel", "france"] },
  { id: "stormshield-blog", name: "Stormshield Blog", url: "https://www.stormshield.com/blog/feed/", website: "https://www.stormshield.com", category: "vendor", country: "FR", language: "en", priority: 2, tags: ["vendor", "france", "network"] },
  { id: "tehtris-blog", name: "TEHTRIS Blog", url: "https://tehtris.com/en/blog/feed/", website: "https://tehtris.com", category: "vendor", country: "FR", language: "en", priority: 2, tags: ["vendor", "france", "xdr"] },
  { id: "harfanglab-blog", name: "HarfangLab Blog", url: "https://harfanglab.io/en/blog/feed/", website: "https://harfanglab.io", category: "vendor", country: "FR", language: "en", priority: 2, tags: ["vendor", "france", "edr"] },
];

// ---------------------------------------------------------------------------
// CVE / Vulnerability Databases (20+)
// ---------------------------------------------------------------------------

const cveSources: Source[] = [
  { id: "nvd-recent", name: "NVD Recent CVEs", url: "https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss.xml", website: "https://nvd.nist.gov", category: "cve", country: "US", language: "en", priority: 1, tags: ["cve", "nvd", "vulnerabilities"] },
  { id: "nvd-analyzed", name: "NVD Analyzed CVEs", url: "https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss-analyzed.xml", website: "https://nvd.nist.gov", category: "cve", country: "US", language: "en", priority: 1, tags: ["cve", "nvd", "analyzed"] },
  { id: "cve-org", name: "CVE.org Updates", url: "https://www.cve.org/AllResources/CveServices/Rss", website: "https://www.cve.org", category: "cve", country: "US", language: "en", priority: 1, tags: ["cve", "mitre"] },
  { id: "vuldb-recent", name: "VulDB Recent", url: "https://vuldb.com/?rss.recent", website: "https://vuldb.com", category: "cve", country: "CH", language: "en", priority: 2, tags: ["cve", "vuldb"] },
  { id: "vuldb-updates", name: "VulDB Updates", url: "https://vuldb.com/?rss.updates", website: "https://vuldb.com", category: "cve", country: "CH", language: "en", priority: 2, tags: ["cve", "vuldb"] },
  { id: "exploit-db", name: "Exploit-DB", url: "https://www.exploit-db.com/rss.xml", website: "https://www.exploit-db.com", category: "cve", country: "US", language: "en", priority: 1, tags: ["exploits", "poc", "vulnerabilities"] },
  { id: "zdi-advisories", name: "Zero Day Initiative", url: "https://www.zerodayinitiative.com/rss/published/", website: "https://www.zerodayinitiative.com", category: "cve", country: "US", language: "en", priority: 1, tags: ["zero-day", "advisories", "vendor"] },
  { id: "zdi-upcoming", name: "ZDI Upcoming Advisories", url: "https://www.zerodayinitiative.com/rss/upcoming/", website: "https://www.zerodayinitiative.com", category: "cve", country: "US", language: "en", priority: 1, tags: ["zero-day", "upcoming"] },
  { id: "vulners-blog", name: "Vulners Blog", url: "https://vulners.com/rss.xml", website: "https://vulners.com", category: "cve", country: "US", language: "en", priority: 2, tags: ["cve", "intelligence"] },
  { id: "seclists-fulldisclosure", name: "Full Disclosure", url: "https://seclists.org/rss/fulldisclosure.rss", website: "https://seclists.org", category: "cve", country: "US", language: "en", priority: 2, tags: ["disclosure", "vulnerabilities"] },
  { id: "seclists-oss-sec", name: "oss-security", url: "https://seclists.org/rss/oss-sec.rss", website: "https://seclists.org", category: "cve", country: "US", language: "en", priority: 2, tags: ["opensource", "vulnerabilities"] },
  { id: "seclists-bugtraq", name: "Bugtraq", url: "https://seclists.org/rss/bugtraq.rss", website: "https://seclists.org", category: "cve", country: "US", language: "en", priority: 2, tags: ["bugtraq", "vulnerabilities"] },
  { id: "github-advisories", name: "GitHub Security Advisories", url: "https://github.com/advisories/feed", website: "https://github.com/advisories", category: "cve", country: "US", language: "en", priority: 1, tags: ["github", "advisories", "dependencies"] },
  { id: "cvetrends", name: "CVE Trends", url: "https://cvetrends.com/api/cves/24hrs/rss", website: "https://cvetrends.com", category: "cve", country: "US", language: "en", priority: 2, tags: ["cve", "trending"] },
  { id: "opencve", name: "OpenCVE", url: "https://www.opencve.io/rss", website: "https://www.opencve.io", category: "cve", country: "FR", language: "en", priority: 2, tags: ["cve", "monitoring"] },
  { id: "debian-security", name: "Debian Security", url: "https://www.debian.org/security/dsa.en.rdf", website: "https://www.debian.org/security", category: "cve", country: "INTL", language: "en", priority: 2, tags: ["debian", "linux", "advisories"] },
  { id: "ubuntu-security", name: "Ubuntu Security", url: "https://ubuntu.com/security/notices/rss.xml", website: "https://ubuntu.com/security", category: "cve", country: "GB", language: "en", priority: 2, tags: ["ubuntu", "linux", "advisories"] },
  { id: "redhat-security", name: "Red Hat Security", url: "https://access.redhat.com/blogs/766093/feed", website: "https://access.redhat.com/security", category: "cve", country: "US", language: "en", priority: 2, tags: ["redhat", "linux", "advisories"] },
  { id: "alpine-security", name: "Alpine Linux Security", url: "https://alpinelinux.org/atom.xml", website: "https://alpinelinux.org", category: "cve", country: "INTL", language: "en", priority: 3, tags: ["alpine", "linux", "containers"] },
  { id: "gentoo-security", name: "Gentoo Security", url: "https://security.gentoo.org/glsa/feed.rss", website: "https://security.gentoo.org", category: "cve", country: "INTL", language: "en", priority: 3, tags: ["gentoo", "linux"] },
  { id: "mozilla-advisories", name: "Mozilla Security Advisories", url: "https://www.mozilla.org/en-US/security/advisories/rss/", website: "https://www.mozilla.org/security", category: "cve", country: "US", language: "en", priority: 2, tags: ["mozilla", "firefox", "browser"] },
  { id: "chromium-releases", name: "Chrome Releases", url: "https://chromereleases.googleblog.com/feeds/posts/default?alt=rss", website: "https://chromereleases.googleblog.com", category: "cve", country: "US", language: "en", priority: 2, tags: ["chrome", "browser", "google"] },
  { id: "apple-security", name: "Apple Security Updates", url: "https://support.apple.com/en-us/HT201222/rss", website: "https://support.apple.com/security", category: "cve", country: "US", language: "en", priority: 2, tags: ["apple", "ios", "macos"] },
];

// ---------------------------------------------------------------------------
// Threat Intelligence (30+)
// ---------------------------------------------------------------------------

const threatIntelSources: Source[] = [
  { id: "alienvault-otx", name: "AlienVault OTX Blog", url: "https://otx.alienvault.com/pulse/rss", website: "https://otx.alienvault.com", category: "threat-intel", country: "US", language: "en", priority: 1, tags: ["threat-intel", "ioc", "otx"] },
  { id: "virustotal-blog", name: "VirusTotal Blog", url: "https://blog.virustotal.com/feeds/posts/default?alt=rss", website: "https://blog.virustotal.com", category: "threat-intel", country: "US", language: "en", priority: 1, tags: ["threat-intel", "malware", "analysis"] },
  { id: "abuse-ch-urlhaus", name: "URLhaus Recent", url: "https://urlhaus.abuse.ch/feeds/payloads/", website: "https://urlhaus.abuse.ch", category: "threat-intel", country: "CH", language: "en", priority: 1, tags: ["threat-intel", "malware", "urls"] },
  { id: "abuse-ch-malwarebazaar", name: "MalwareBazaar", url: "https://bazaar.abuse.ch/feeds/latest/", website: "https://bazaar.abuse.ch", category: "threat-intel", country: "CH", language: "en", priority: 1, tags: ["threat-intel", "malware", "samples"] },
  { id: "abuse-ch-threatfox", name: "ThreatFox IOCs", url: "https://threatfox.abuse.ch/feeds/iocs/", website: "https://threatfox.abuse.ch", category: "threat-intel", country: "CH", language: "en", priority: 1, tags: ["threat-intel", "ioc"] },
  { id: "abuse-ch-feodotracker", name: "Feodo Tracker", url: "https://feodotracker.abuse.ch/downloads/ipblocklist_aggressive.txt", website: "https://feodotracker.abuse.ch", category: "threat-intel", country: "CH", language: "en", priority: 2, tags: ["threat-intel", "botnet", "c2"] },
  { id: "mitre-attack-blog", name: "MITRE ATT&CK Blog", url: "https://medium.com/feed/mitre-attack", website: "https://medium.com/mitre-attack", category: "threat-intel", country: "US", language: "en", priority: 1, tags: ["mitre", "attack", "framework", "ttp"] },
  { id: "mitre-engenuity", name: "MITRE Engenuity", url: "https://mitre-engenuity.org/blog/feed/", website: "https://mitre-engenuity.org", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["mitre", "evaluation"] },
  { id: "recorded-future", name: "Recorded Future Blog", url: "https://www.recordedfuture.com/feed", website: "https://www.recordedfuture.com", category: "threat-intel", country: "US", language: "en", priority: 1, tags: ["threat-intel", "apt", "nation-state"] },
  { id: "intel471-blog", name: "Intel 471 Blog", url: "https://intel471.com/blog/feed/", website: "https://intel471.com", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "cybercrime", "underground"] },
  { id: "flashpoint-blog", name: "Flashpoint Blog", url: "https://flashpoint.io/blog/feed/", website: "https://flashpoint.io", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "deep-web", "cybercrime"] },
  { id: "group-ib-blog", name: "Group-IB Blog", url: "https://www.group-ib.com/blog/feed/", website: "https://www.group-ib.com", category: "threat-intel", country: "SG", language: "en", priority: 2, tags: ["threat-intel", "cybercrime", "apt"] },
  { id: "team-cymru", name: "Team Cymru Blog", url: "https://team-cymru.com/blog/feed/", website: "https://team-cymru.com", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "network", "dns"] },
  { id: "shadowserver", name: "Shadowserver Foundation", url: "https://www.shadowserver.org/news/feed/", website: "https://www.shadowserver.org", category: "threat-intel", country: "INTL", language: "en", priority: 2, tags: ["threat-intel", "scanning", "botnet"] },
  { id: "spamhaus-blog", name: "Spamhaus Blog", url: "https://www.spamhaus.org/news/rss/", website: "https://www.spamhaus.org", category: "threat-intel", country: "INTL", language: "en", priority: 2, tags: ["threat-intel", "spam", "botnets"] },
  { id: "phishtank", name: "PhishTank Blog", url: "https://phishtank.org/blog/feed/", website: "https://phishtank.org", category: "threat-intel", country: "US", language: "en", priority: 3, tags: ["threat-intel", "phishing"] },
  { id: "ransomware-live", name: "Ransomware.live", url: "https://www.ransomware.live/rss.xml", website: "https://www.ransomware.live", category: "threat-intel", country: "FR", language: "en", priority: 1, tags: ["threat-intel", "ransomware", "tracking"] },
  { id: "ransomlook", name: "RansomLook", url: "https://www.ransomlook.io/rss.xml", website: "https://www.ransomlook.io", category: "threat-intel", country: "FR", language: "en", priority: 2, tags: ["threat-intel", "ransomware"] },
  { id: "malware-traffic", name: "Malware Traffic Analysis", url: "https://www.malware-traffic-analysis.net/blog-entries.rss", website: "https://www.malware-traffic-analysis.net", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "pcap", "malware"] },
  { id: "any-run-blog", name: "ANY.RUN Blog", url: "https://any.run/cybersecurity-blog/feed/", website: "https://any.run", category: "threat-intel", country: "INTL", language: "en", priority: 2, tags: ["threat-intel", "sandbox", "malware"] },
  { id: "hybrid-analysis-blog", name: "Hybrid Analysis Blog", url: "https://www.hybrid-analysis.com/rss", website: "https://www.hybrid-analysis.com", category: "threat-intel", country: "US", language: "en", priority: 3, tags: ["threat-intel", "sandbox"] },
  { id: "cti-league", name: "CTI League Blog", url: "https://cti-league.com/blog/feed/", website: "https://cti-league.com", category: "threat-intel", country: "INTL", language: "en", priority: 3, tags: ["threat-intel", "volunteer", "community"] },
  { id: "silobreaker", name: "Silobreaker Blog", url: "https://www.silobreaker.com/blog/feed/", website: "https://www.silobreaker.com", category: "threat-intel", country: "GB", language: "en", priority: 3, tags: ["threat-intel", "osint"] },
  { id: "socradar-blog", name: "SOCRadar Blog", url: "https://socradar.io/blog/feed/", website: "https://socradar.io", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "dark-web", "monitoring"] },
  { id: "censys-blog", name: "Censys Blog", url: "https://censys.com/blog/feed/", website: "https://censys.com", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "exposure", "scanning"] },
  { id: "greynoise-blog", name: "GreyNoise Blog", url: "https://www.greynoise.io/blog/rss.xml", website: "https://www.greynoise.io", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "scanning", "noise"] },
  { id: "shodan-blog", name: "Shodan Blog", url: "https://blog.shodan.io/rss/", website: "https://blog.shodan.io", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "scanning", "iot"] },
  { id: "binaryedge-blog", name: "BinaryEdge Blog", url: "https://blog.binaryedge.io/rss/", website: "https://blog.binaryedge.io", category: "threat-intel", country: "PT", language: "en", priority: 3, tags: ["threat-intel", "exposure"] },
  { id: "curated-intel", name: "Curated Intelligence", url: "https://www.curatedintel.org/feeds/posts/default?alt=rss", website: "https://www.curatedintel.org", category: "threat-intel", country: "INTL", language: "en", priority: 2, tags: ["threat-intel", "community"] },
  { id: "trellix-blog", name: "Trellix Research Blog", url: "https://www.trellix.com/blogs/research/rss/", website: "https://www.trellix.com", category: "threat-intel", country: "US", language: "en", priority: 2, tags: ["threat-intel", "apt", "malware"] },
];

// ---------------------------------------------------------------------------
// Research (20+)
// ---------------------------------------------------------------------------

const researchSources: Source[] = [
  { id: "arxiv-crypto", name: "arXiv Cryptography", url: "https://rss.arxiv.org/rss/cs.CR", website: "https://arxiv.org/list/cs.CR/recent", category: "research", country: "INTL", language: "en", priority: 2, tags: ["research", "academic", "cryptography"] },
  { id: "arxiv-ai-security", name: "arXiv AI Security", url: "https://rss.arxiv.org/rss/cs.AI", website: "https://arxiv.org/list/cs.AI/recent", category: "research", country: "INTL", language: "en", priority: 3, tags: ["research", "academic", "ai"] },
  { id: "ccc-updates", name: "CCC Updates", url: "https://www.ccc.de/en/rss/updates.xml", website: "https://www.ccc.de", category: "research", country: "DE", language: "en", priority: 2, tags: ["research", "ccc", "hacking", "germany"] },
  { id: "ccc-events", name: "CCC Events", url: "https://events.ccc.de/feed/", website: "https://events.ccc.de", category: "research", country: "DE", language: "en", priority: 3, tags: ["research", "events", "ccc"] },
  { id: "ieee-security", name: "IEEE Security & Privacy", url: "https://ieeexplore.ieee.org/rss/TOC8013.XML", website: "https://ieeexplore.ieee.org", category: "research", country: "US", language: "en", priority: 3, tags: ["research", "academic", "ieee"] },
  { id: "acm-ccs", name: "ACM CCS", url: "https://dl.acm.org/action/showFeed?type=etoc&feed=rss&jc=sigsac", website: "https://dl.acm.org", category: "research", country: "US", language: "en", priority: 3, tags: ["research", "academic", "acm"] },
  { id: "usenix-security", name: "USENIX Security", url: "https://www.usenix.org/taxonomy/term/4/feed", website: "https://www.usenix.org", category: "research", country: "US", language: "en", priority: 3, tags: ["research", "academic", "usenix"] },
  { id: "trailofbits", name: "Trail of Bits Blog", url: "https://blog.trailofbits.com/feed/", website: "https://blog.trailofbits.com", category: "research", country: "US", language: "en", priority: 2, tags: ["research", "audit", "blockchain"] },
  { id: "ncc-group", name: "NCC Group Research", url: "https://research.nccgroup.com/feed/", website: "https://research.nccgroup.com", category: "research", country: "GB", language: "en", priority: 2, tags: ["research", "audit", "security"] },
  { id: "portswigger-research", name: "PortSwigger Research", url: "https://portswigger.net/research/rss", website: "https://portswigger.net/research", category: "research", country: "GB", language: "en", priority: 1, tags: ["research", "web-security", "burp"] },
  { id: "portswigger-daily", name: "PortSwigger Daily Swig", url: "https://portswigger.net/daily-swig/rss", website: "https://portswigger.net/daily-swig", category: "news", country: "GB", language: "en", priority: 2, tags: ["news", "web-security"] },
  { id: "synacktiv-blog", name: "Synacktiv Blog", url: "https://www.synacktiv.com/blog/feed", website: "https://www.synacktiv.com", category: "research", country: "FR", language: "en", priority: 2, tags: ["research", "pentest", "france"] },
  { id: "lexfo-blog", name: "Lexfo Blog", url: "https://blog.lexfo.fr/feed.xml", website: "https://blog.lexfo.fr", category: "research", country: "FR", language: "en", priority: 3, tags: ["research", "pentest", "france"] },
  { id: "quarkslab-blog", name: "Quarkslab Blog", url: "https://blog.quarkslab.com/feeds/all.rss.xml", website: "https://blog.quarkslab.com", category: "research", country: "FR", language: "en", priority: 2, tags: ["research", "reverse-engineering", "france"] },
  { id: "pentest-partners", name: "Pen Test Partners", url: "https://www.pentestpartners.com/security-blog/feed/", website: "https://www.pentestpartners.com", category: "research", country: "GB", language: "en", priority: 2, tags: ["research", "iot", "pentest"] },
  { id: "bishopfox-blog", name: "Bishop Fox Blog", url: "https://bishopfox.com/blog/rss.xml", website: "https://bishopfox.com", category: "research", country: "US", language: "en", priority: 2, tags: ["research", "pentest", "offensive"] },
  { id: "specterops-blog", name: "SpecterOps Blog", url: "https://posts.specterops.io/feed", website: "https://posts.specterops.io", category: "research", country: "US", language: "en", priority: 2, tags: ["research", "red-team", "active-directory"] },
  { id: "letsdefend-blog", name: "LetsDefend Blog", url: "https://letsdefend.io/blog/feed/", website: "https://letsdefend.io", category: "research", country: "INTL", language: "en", priority: 3, tags: ["research", "blue-team", "training"] },
  { id: "intigriti-blog", name: "Intigriti Blog", url: "https://blog.intigriti.com/feed/", website: "https://blog.intigriti.com", category: "research", country: "BE", language: "en", priority: 2, tags: ["research", "bug-bounty"] },
  { id: "hackerone-blog", name: "HackerOne Blog", url: "https://www.hackerone.com/blog.rss", website: "https://www.hackerone.com", category: "research", country: "US", language: "en", priority: 2, tags: ["research", "bug-bounty"] },
  { id: "assetnote-blog", name: "Assetnote Blog", url: "https://blog.assetnote.io/feed.xml", website: "https://blog.assetnote.io", category: "research", country: "AU", language: "en", priority: 2, tags: ["research", "attack-surface", "web"] },
  { id: "wireguard-blog", name: "WireGuard Blog", url: "https://www.wireguard.com/blog.atom", website: "https://www.wireguard.com", category: "research", country: "INTL", language: "en", priority: 3, tags: ["research", "vpn", "cryptography"] },
  { id: "phrack", name: "Phrack Magazine", url: "https://phrack.org/rss.xml", website: "https://phrack.org", category: "research", country: "INTL", language: "en", priority: 2, tags: ["research", "hacking", "classic"] },
  { id: "atredis-blog", name: "Atredis Partners Blog", url: "https://www.atredis.com/blog?format=rss", website: "https://www.atredis.com", category: "research", country: "US", language: "en", priority: 3, tags: ["research", "pentest"] },
];

// ---------------------------------------------------------------------------
// Combine all sources
// ---------------------------------------------------------------------------

export const sources: Source[] = [
  ...certSources,
  ...newsSources,
  ...vendorSources,
  ...cveSources,
  ...threatIntelSources,
  ...researchSources,
];

// ---------------------------------------------------------------------------
// Accessor helpers
// ---------------------------------------------------------------------------

export function getSourcesByCategory(category: Source["category"]): Source[] {
  return sources.filter((s) => s.category === category);
}

export function getSourcesByCountry(country: string): Source[] {
  return sources.filter((s) => s.country === country);
}

export function getSourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function getSourcesByPriority(maxPriority: number = 2): Source[] {
  return sources
    .filter((s) => s.priority <= maxPriority)
    .sort((a, b) => a.priority - b.priority);
}
