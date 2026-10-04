import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, serverTimestamp, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRdGf65oWBZvA5LQ1HDxo_d4jYz8xhNEc",
  authDomain: "backlink-tracker-bf7c7.firebaseapp.com",
  projectId: "backlink-tracker-bf7c7",
  storageBucket: "backlink-tracker-bf7c7.firebasestorage.app",
  messagingSenderId: "1021726638369",
  appId: "1:1021726638369:web:f46a64fe9f8a0ec61fbe60"
};

const websitesData = [
  { name: "Active Search Results", dr: 74, url: "https://www.activesearchresults.com/" },
  { name: "Tumblr", dr: 94, url: "https://tumblr.com/" },
  { name: "Side Projectors", dr: 70, url: "https://www.sideprojectors.com/" },
  { name: "Tiny Launch", dr: 69, url: "https://www.tinylaunch.com/" },
  { name: "Peer Push", dr: 67, url: "https://peerpush.net/" },
  { name: "Hacker News", dr: 91, url: "https://news.ycombinator.com/" },
  { name: "SiteLike", dr: 68, url: "https://www.sitelike.org/" },
  { name: "DevPost", dr: 87, url: "https://devpost.com/" },
  { name: "Foundr List", dr: 72, url: "https://foundrlist.com/" },
  { name: "Alternative to", dr: 79, url: "https://alternativeto.net/" },
  { name: "Peerlist", dr: 75, url: "https://peerlist.io/" },
  { name: "What launched today", dr: 55, url: "https://www.whatlaunched.today/" },
  { name: "Indiehackers", dr: 80, url: "https://www.indiehackers.com/" },
  { name: "Product hunt", dr: 91, url: "https://producthunt.com/" },
  { name: "Uneed Best", dr: 74, url: "https://www.uneed.best/" },
  { name: "Show My Sites", dr: 58, url: "https://www.showmysites.com/" },
  { name: "Clutch", dr: 91, url: "https://clutch.co/" },
  { name: "Good Firms", dr: 86, url: "https://www.goodfirms.co/" },
  { name: "Ramen Tools", dr: 53, url: "https://ramen.tools/" },
  { name: "Addonbiz", dr: 65, url: "https://www.addonbiz.com/" },
  { name: "BestofAI", dr: 48, url: "https://bestofai.com/" },
  { name: "Promote Project", dr: 47, url: "https://www.promoteproject.com/" },
  { name: "UFind best", dr: 47, url: "https://ufind.best/" },
  { name: "Pitch Wall", dr: 60, url: "https://pitchwall.co/" },
  { name: "Launchitx", dr: 49, url: "https://launchitx.com/" },
  { name: "Business Hunt", dr: 43, url: "https://businesshunt.co/" },
  { name: "Launch Vault", dr: 53, url: "https://www.launchvault.dev/" },
  { name: "Makers", dr: 50, url: "https://make.rs/" },
  { name: "Indiehunt", dr: 50, url: "https://indiehunt.io/" },
  { name: "Startup Found", dr: 38, url: "https://startupfound.com/" },
  { name: "Launch List", dr: 36, url: "https://www.launch-list.org/" },
  { name: "Indie Hacker Stacks", dr: 35, url: "https://indiehackerstacks.com/" },
  { name: "Try Launch", dr: 35, url: "https://trylaunch.ai/" },
  { name: "CoderLegion", dr: 41, url: "https://coderlegion.com/" },
  { name: "Hot100AI", dr: 55, url: "https://www.hot100.ai/" },
  { name: "Sidebar", dr: 70, url: "https://sidebar.io/" },
  { name: "TechTrending", dr: 33, url: "https://www.techtrendin.com/" },
  { name: "Navs Site", dr: 63, url: "https://navs.site/" },
  { name: "StartupFast", dr: 60, url: "https://www.startupfa.st/" },
  { name: "Find Your SaaS", dr: 35, url: "https://www.findyoursaas.com/" },
  { name: "Neeed Directory", dr: 72, url: "https://neeed.directory/" },
  { name: "Startups Lab", dr: 58, url: "https://startupslab.site/" },
  { name: "SaaS Browser", dr: 58, url: "https://saasbrowser.com/" },
  { name: "ShipYard HQ", dr: 36, url: "https://shipyardhq.dev/" },
  { name: "Curate Click", dr: 37, url: "https://curateclick.com/" },
  { name: "MicroSaaS Directory", dr: 35, url: "https://microsaas.directory/" },
  { name: "VibeRank", dr: 40, url: "https://viberank.dev/" },
  { name: "Theorg", dr: 75, url: "https://theorg.com/" },
  { name: "Yelp", dr: 94, url: "https://business.yelp.com/" },
  { name: "Daily Pings", dr: 54, url: "https://dailypings.com/" },
  { name: "Zumvu", dr: 72, url: "https://zumvu.com/" },
  { name: "Venture Radar", dr: 51, url: "http://ventureradar.com/add_company" },
  { name: "Express Business Directory", dr: 62, url: "https://www.expressbusinessdirectory.com/" },
  { name: "Sooper Articles", dr: 65, url: "https://sooperarticles.com/" },
  { name: "Tech Directory", dr: 67, url: "https://www.techdirectory.io/" },
  { name: "Scribd", dr: 95, url: "https://www.scribd.com/" },
  { name: "Kickstarter", dr: 92, url: "https://www.kickstarter.com/" },
  { name: "Goodreads", dr: 94, url: "https://www.goodreads.com/" },
  { name: "LetterBox", dr: 88, url: "https://letterboxd.com/" },
  { name: "Gust", dr: 75, url: "https://gust.com/" },
  { name: "Zee Maps", dr: 75, url: "https://www.zeemaps.com/" },
  { name: "Startups Xplore", dr: 65, url: "https://startupxplore.com/" },
  { name: "PointBlog", dr: 60, url: "https://pointblog.net/" },
  { name: "BlogDiggy", dr: 56, url: "https://blogdigy.com/" },
  { name: "Blog5", dr: 57, url: "https://blog5.net/" },
  { name: "MpeBlog", dr: 52, url: "https://mpeblog.com/" },
  { name: "Just Paste it", dr: 80, url: "https://justpaste.it/" },
  { name: "Flip Board", dr: 87, url: "https://flipboard.com/" },
  { name: "Expatriates", dr: 62, url: "https://expatriates.com/" },
  { name: "Sub Stack", dr: 94, url: "https://substack.com/" },
  { name: "Coub", dr: 75, url: "https://coub.com/" },
  { name: "Mix Cloud", dr: 91, url: "https://www.mixcloud.com/" },
  { name: "Padlet", dr: 90, url: "https://padlet.com/" },
  { name: "Pinterest", dr: 97, url: "https://www.pinterest.com/" },
  { name: "Scout Forge", dr: 46, url: "https://scoutforge.net/" },
  { name: "Hot Frog", dr: 81, url: "https://www.hotfrog.com/" },
  { name: "Local Pages", dr: 51, url: "https://localpages.com/" },
  { name: "Instapaper", dr: 81, url: "https://instapaper.com/" },
  { name: "PearlTrees", dr: 78, url: "https://www.pearltrees.com/" },
  { name: "Dev To", dr: 90, url: "https://dev.to/" },
  { name: "Proven Expert", dr: 91, url: "https://www.provenexpert.com/" },
  { name: "Link Centre", dr: 72, url: "http://www.linkcentre.com/" },
  { name: "Net U", dr: 51, url: "https://www.netu.ai/" },
  { name: "Live Journal", dr: 90, url: "http://livejournal.com/" },
  { name: "Blogger", dr: 94, url: "https://www.blogger.com/" },
  { name: "BCZ", dr: 71, url: "https://bcz.com/" },
  { name: "Startup Blink", dr: 72, url: "https://www.startupblink.com/" },
  { name: "Start Me", dr: 75, url: "https://start.me/" },
  { name: "Guide.co", dr: 68, url: "http://guide.co/" },
  { name: "Tiny Shelf", dr: 46, url: "https://www.tinyshelf.co/" },
  { name: "Product Watch", dr: 72, url: "https://productwatch.io/" },
  { name: "Dev Resources", dr: 44, url: "https://devresourc.es/" },
  { name: "Findly Tools", dr: 76, url: "https://findly.tools/" },
  { name: "Fazier", dr: 80, url: "https://fazier.com/" },
  { name: "Twelve Tools", dr: 80, url: "http://twelve.tools/" },
  { name: "Well Found", dr: 87, url: "http://wellfound.com/" },
  { name: "PasteBin", dr: 92, url: "https://pastebin.com/" },
  { name: "Yellow Pages", dr: 89, url: "https://www.yellowpages.com/" },
  { name: "PRLOG Business Directory", dr: 83, url: "https://biz.prlog.org/" },
  { name: "Adland", dr: 80, url: "http://www.adlandpro.com/" },
  { name: "HeadwayApp", dr: 77, url: "https://headwayapp.co/" },
  { name: "Store Board", dr: 77, url: "https://www.storeboard.com/" },
  { name: "Callup contact", dr: 76, url: "https://www.callupcontact.com/" },
  { name: "SEO Motionz", dr: 54, url: "https://seomotionz.com/" },
  { name: "Blog Gold", dr: 52, url: "https://blog-gold.com/" },
  { name: "Blog Nody", dr: 51, url: "https://blognody.com/" },
  { name: "About your Blog", dr: 50, url: "https://aboutyoublog.com/" },
  { name: "Startup Tracker", dr: 45, url: "https://startuptracker.io/crowdsourcing/" },
  { name: "Early Hunt", dr: 45, url: "https://earlyhunt.com/" },
  { name: "A1Bookmarks", dr: 44, url: "https://www.a1bookmarks.com/" },
  { name: "Built By Me", dr: 40, url: "https://builtbyme.io/" },
  { name: "DR checker", dr: 39, url: "https://drchecker.org/" },
  { name: "Proof Stories", dr: 34, url: "https://proofstories.io/" },
  { name: "Dev Hub Best", dr: 33, url: "https://devhub.best/" },
  { name: "Bulletin.so", dr: 33, url: "http://bulletin.so/" },
  { name: "Launch cab", dr: 30, url: "https://launch.cab/" }
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log(`Starting insertion of ${websitesData.length} websites into Firestore...`);
  const existingSnap = await getDocs(collection(db, 'websites'));
  const existingNames = new Set(existingSnap.docs.map(d => (d.data().name || '').toLowerCase().trim()));
  const existingUrls = new Set(existingSnap.docs.map(d => (d.data().url || '').toLowerCase().trim().replace(/\/+$/, '')));

  console.log(`Currently in Firestore: ${existingSnap.size} websites`);

  const toAdd = websitesData.filter(site => {
    const normName = site.name.toLowerCase().trim();
    const normUrl = site.url.toLowerCase().trim().replace(/\/+$/, '');
    return !existingNames.has(normName) && !existingUrls.has(normUrl);
  });

  console.log(`New websites to add: ${toAdd.length}`);

  if (toAdd.length === 0) {
    console.log('All websites already exist in Firestore.');
    process.exit(0);
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const site of toAdd) {
    const docRef = doc(collection(db, 'websites'));
    batch.set(docRef, {
      name: site.name.trim(),
      url: site.url.trim(),
      dr: site.dr,
      notes: `DR: ${site.dr}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtFallback: now,
    });
  }

  console.log('Committing batch to Firestore...');
  await batch.commit();
  console.log(`Successfully added ${toAdd.length} websites to Firestore!`);

  const finalSnap = await getDocs(collection(db, 'websites'));
  console.log(`Total websites now in Firestore: ${finalSnap.size}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error seeding websites:', err);
  process.exit(1);
});
