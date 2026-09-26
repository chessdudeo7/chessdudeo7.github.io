const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
document.documentElement.classList.add("js");

document.getElementById("year").textContent = new Date().getFullYear();
const defaultDocumentTitle = document.title;

const navLinks = [...document.querySelectorAll(".site-header nav a")];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));

function updatePageState() {
  const range = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty("--scroll-progress", `${range > 0 ? scrollY / range * 100 : 0}%`);
  let activeIndex = -1;
  navSections.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top <= innerHeight * .42) activeIndex = index;
  });
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) activeIndex = navLinks.length - 1;
  navLinks.forEach((link, index) => {
    const active = index === activeIndex;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

addEventListener("scroll", updatePageState, { passive: true });
updatePageState();

const motionScenes = reducedMotion ? [] : [...document.querySelectorAll(".projects, .work, .profile, .beyond")];
let motionFrame = 0;

function updateScrollMotion() {
  motionFrame = 0;
  const viewportHeight = innerHeight;

  motionScenes.forEach((scene) => {
    const bounds = scene.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (viewportHeight - bounds.top) / (viewportHeight + bounds.height)));
    const offset = (progress - .5) * 2;
    scene.style.setProperty("--scene-progress", progress.toFixed(3));
    scene.style.setProperty("--scene-x", `${offset * 32}px`);
    scene.style.setProperty("--scene-y", `${offset * 24}px`);

    scene.querySelectorAll(".project, .work-role, .stack-group, .experience article").forEach((item) => {
      const itemBounds = item.getBoundingClientRect();
      const itemProgress = Math.min(1, Math.max(0, (viewportHeight - itemBounds.top) / (viewportHeight + itemBounds.height)));
      item.style.setProperty("--item-progress", itemProgress.toFixed(3));
      item.style.setProperty("--item-lift", `${(1 - itemProgress) * 28}px`);
    });
  });
}

function requestScrollMotion() {
  if (!motionFrame) motionFrame = requestAnimationFrame(updateScrollMotion);
}

if (motionScenes.length) {
  document.documentElement.classList.add("scroll-motion");
  addEventListener("scroll", requestScrollMotion, { passive: true });
  addEventListener("resize", requestScrollMotion);
  updateScrollMotion();
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const counter = entry.target;
    const target = Number(counter.dataset.count);
    const suffix = counter.dataset.suffix || "";
    if (reducedMotion) {
      counter.textContent = `${target}${suffix}`;
    } else {
      const startedAt = performance.now();
      const tick = (time) => {
        const progress = Math.min(1, (time - startedAt) / 900);
        counter.textContent = `${Math.round(target * (1 - Math.pow(1 - progress, 3)))}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    counterObserver.unobserve(counter);
  });
}, { threshold: .7 });

document.querySelectorAll("[data-count]").forEach((counter) => counterObserver.observe(counter));

const projectDetails = {
  clipfarm: {
    index: "PROJECT / 01",
    type: "Featured · Full-stack ML · Team project",
    title: "ClipFarm",
    summary: "Upload a full volleyball game and get back a filterable, score-sorted feed of highlight clips instead of a 30-minute video nobody rewatches.",
    context: "Built with a team under the ClipFarmVB organization. A game goes from the browser straight to Cloudflare R2 through a presigned URL, and a Celery worker takes it through tracking, scoring, pose refinement, and clip cutting. The clips land in a social feed where players can post and follow each other.",
    purpose: "Tracks the ball to find rallies, scores each rally for highlight-worthiness from the crowd reaction and the shape of the rally, relabels the survivors with pose detection, and cuts them into clips tagged by action type.",
    role: "Engineered the Next.js + FastAPI video pipeline, RF-DETR ball tracking with YOLOv8-pose refinement, GPU offloading, the R2 cache, and JWT-authenticated Supabase endpoints. I also built the social layer (posts, a follow graph, and the home feed) and a prefork worker pool that processes several games in parallel.",
    challenge: "Inference over an entire game is slow and expensive, and a player hitting the ball is easy to miss when bodies block the view. The primary path is ball tracking, which works through occlusion, with pose used only to refine rallies that are already strong candidates.",
    highlights: "Contacts are found from ballistic residuals in the ball’s trajectory. Ball tracking and pose run on serverless Modal GPUs, and results are cached in R2, keyed by video hash, so a game is never tracked twice. Skip-decode frame sampling reads only the frames the tracker needs.",
    features: ["RF-DETR ball tracking and ballistic contact detection", "Highlight scoring from crowd reaction and rally shape", "YOLOv8-pose action labels (spike, serve, dig, block)", "Serverless GPU inference with R2 result caching", "Posts, a follow graph, and a keyset-paginated home feed", "Dockerized Next.js, FastAPI, Celery/Redis, and Supabase stack"],
    outcome: "Moving inference to serverless GPUs cut per-game tracking from 13 to 8.7 minutes, and skip-decode frame sampling made tracking 31% faster.",
    next: "The roadmap tags every clip by player as well as action, turning the feed into a per-player highlight library.",
    tags: ["Python", "TypeScript", "FastAPI", "Next.js", "Celery/Redis", "PostgreSQL", "PyTorch", "Modal", "Docker"],
    primary: { label: "View GitHub ↗", href: "https://github.com/ClipFarmVB/ClipFarm" },
  },
  dogwatch: {
    index: "PROJECT / 02",
    type: "Hack the North 2026 winner · Autonomous search",
    title: "Dogwatch",
    summary: "A coordinated fleet that searches Bellot Strait in the Northwest Passage for an unlit vessel, then passes the watch between assets to keep it tracked.",
    context: "Built at Hack the North 2026 for the Dominion Dynamics WHITEOUT challenge, which it won. A quadcopter, a fixed-wing, and two fixed towers have to find a ship with no AIS transponder, a random spawn, and an unknown course, then hold a track on it and post its position to a scored API.",
    purpose: "Keeps a probability field over the water only, lowers it wherever a camera has actually looked, and sends each asset to the stretch of channel currently worth the most, which is rarely the nearest one.",
    role: "Team project. My work included the MAVLink arena adapter, fleet arming and launch, the run loop that joins every part into one tick, channel-shaped search, the tracks API client and hold-across-handoffs logic, stand-off contact holding, motion-gated sightings, terrain-aware tower siting, and the belief-field visualizer.",
    challenge: "A 25 km by 2 km channel is a corridor, not an area, so a lawnmower search wastes most of its time. Until the fleet treated seeing nothing as evidence, the belief field never changed even though the aircraft kept flying.",
    highlights: "Every empty sweep lowers belief in proportion to how well the camera could have seen, derived from pixels on target at the actual slant range, and never to zero. The quadcopter holds contacts from a computed stand-off, because its fixed camera can’t see straight down.",
    features: ["Water-only probability field with negative-information updates", "Search along the channel as a curve, not over a box", "Tracks held across gaps, handoffs, and losses", "Motion-gated sightings, so sea ice isn’t mistaken for a hull", "One geodetic conversion module, enforced by an AST test", "Deterministic replays and a canvas viewer for the belief field"],
    outcome: "Won the Dominion Dynamics WHITEOUT track. The same seed replays byte-for-byte, and the test that enforces one conversion module caught two real coordinate bugs during the build.",
    next: "Two gaps are documented: the detector still needs calibrating on compressed MJPEG frames, and terrain occlusion isn’t modelled in the no-detection update.",
    tags: ["Python", "MAVLink", "Bayesian search", "Computer vision", "Multi-agent coordination"],
    primary: { label: "View GitHub ↗", href: "https://github.com/Ollienel777/HTN_WHITEOUT" },
  },
  hume: {
    index: "PROJECT / 03",
    type: "Hack the 6ix 2026 winner · AI safety",
    title: "HUME",
    summary: "A deterministic belief-revision engine that decides both what a scientific knowledge graph should believe and how confidently, calibrated to the strength of each piece of evidence.",
    context: "Built at Hack the 6ix 2026 for the CORTEX BioSciences “Ground Truth” challenge, and winner of that track. Language models can suggest hypotheses to the graph but never write to it directly, so a persuasive document can’t overwrite what the system knows.",
    purpose: "Reads a stream of experimental results and returns structured edits to the graph: strengthening or weakening beliefs, scoping exceptions, and flagging claims outside what the model can reason about.",
    role: "Team project. I engineered the structural firewall against prompt injection, the log-odds belief update, structural out-of-distribution detection, the perception layer for text parsing, and the adversarial test battery.",
    challenge: "A strong result should move a belief a lot, a weak or fraudulent one barely at all, and a result outside the graph’s scope should trigger an extension rather than a bad edit. Telling a real contradiction apart from an unmodelled situation is the hard part.",
    highlights: "Confidence moves by a log-odds likelihood-ratio update driven by structured provenance, not by the wording of the text. Text parsing is isolated behind a perception layer with NegEx/ConText-style negation and modality scoping.",
    features: ["Structural firewall against prompt injection", "Log-odds likelihood-ratio belief updates", "Structural out-of-distribution detection", "Negation and modality scoping for text evidence", "19-probe adversarial battery (paraphrase, renamed entities, injection)"],
    outcome: "Won the Cortex Biosciences track ($1,000). The 19-probe battery showed whether the engine generalized to paraphrases, renamed entities, and injection attempts.",
    next: "Next steps: grow the adversarial battery and measure how well the confidence values are calibrated.",
    tags: ["Python", "Knowledge graphs", "Bayesian inference", "NLP", "Adversarial testing"],
    primary: { label: "View GitHub ↗", href: "https://github.com/Ollienel777/GROUND-TRUTH-HT6" },
  },
  lumi: {
    index: "PROJECT / 04",
    type: "Auxilium · AI agents · Retrieval-augmented generation",
    title: "Lumi",
    summary: "Auxilium’s chat assistant. In one conversation, a student can find a peer mentor, book a session, and then work through real Waterloo math contest problems.",
    context: "A single chat endpoint routes each message to the right LangChain agent, so a student never has to change pages. I built the contest-tutoring half with a teammate who built mentor matching and booking. Both halves share one LLM layer with automatic failover between providers.",
    purpose: "Answers requests like “Euclid 2023 problem 5”, “geometry practice for grade 10”, or “make me a 10-problem set from CIMC”. It returns the actual problem image cropped from the source PDF, so diagrams survive, and builds printable worksheets with matching solutions.",
    role: "Built the contest agent: PDF ingestion, retrieval, problem-set and solution-set generation, and contest routing. I also cut per-query LLM usage and made the service stable on a 1GB instance.",
    challenge: "Contest PDFs have no machine-readable problem boundaries. The service also runs on a 1GB instance, where importing PyTorch alone costs 300 to 500MB and loading the whole corpus for a search caused out-of-memory crashes.",
    highlights: "The ingestor finds problem numbers by the median x-position of the numbering column, which is more robust than regex over page text. Problems are embedded with ONNX Runtime and searched in MongoDB Atlas by contest, year, topic, and grade, with a streaming top-k fallback.",
    features: ["1,743 problems from Euclid, CIMC/CSMC, Fryer/Galois/Hypatia, and Gauss–Fermat", "Auto-tagging into eight topics", "Problem images cropped from the source PDFs with PyMuPDF", "A4 worksheets with matching solution sets", "Multi-provider LLM failover"],
    outcome: "Streaming top-k scoring cut retrieval memory from O(corpus) to O(k) and ended the out-of-memory crashes. Removing duplicate prompt rewrites halved LLM calls per query and brought typical latency from 3.2s to 1.8s.",
    next: "Next steps: add more contests to the corpus and track each student’s progress to recommend problems at the right difficulty.",
    tags: ["Python", "FastAPI", "LangChain", "RAG", "MongoDB Atlas", "ONNX Runtime", "PyMuPDF"],
    primary: { label: "View GitHub ↗", href: "https://github.com/Emily3226/lumi" },
  },
  knightmare: {
    index: "PROJECT / 05",
    type: "AI / ML · ChessHacks 2025",
    title: "KnightMare",
    summary: "A neural chess bot built for ChessHacks that learns from grandmaster games which move a strong player would choose.",
    context: "Built for the ChessHacks hackathon in 2025. Instead of classical alpha-beta search like Stockfish, KnightMare learns move choices directly from 100,000+ grandmaster games, as a policy network.",
    purpose: "Encodes the current position, scores every move in its learned move vocabulary, maps those scores onto the legal moves from python-chess, and plays the most likely one.",
    role: "Solo project covering PGN parsing, board encoding, the network, cloud training on Modal, and the bot that serves the model.",
    challenge: "Early versions sometimes suggested illegal moves, 100,000+ games had to be processed efficiently, and training on a local CPU was too slow for a hackathon.",
    highlights: "Each position is 12 piece planes (one per piece type and colour) plus 5 scalar features, including side to move and castling rights. A residual CNN with 4 blocks and 64 filters feeds a fully connected policy head, and outputs are masked to legal moves at inference.",
    features: ["FEN-to-tensor encoding (12 × 8 × 8 planes plus scalars)", "Residual CNN policy network in PyTorch", "Move vocabulary built from the training games", "Legal-move masking at inference", "GPU training on Modal with per-epoch checkpoints"],
    outcome: "An end-to-end ML pipeline, from raw PGN files to a playable bot. Moving training to Modal GPUs made it possible to iterate within the hackathon.",
    next: "Next steps: add a value head and a shallow search on top of the policy, and benchmark its moves against an engine.",
    tags: ["Python", "PyTorch", "Modal", "python-chess", "NumPy"],
    primary: { label: "View GitHub ↗", href: "https://github.com/chessdudeo7/ChessHacks" },
  },
  grandmaster: {
    index: "PROJECT / 06",
    type: "Chess training & coaching · Umbrella project",
    title: "Grandmaster Suite",
    summary: "The umbrella repository for my chess software: a study site, a neural chess bot, and the website I use to run coaching.",
    context: "Grandmaster Suite ties together three projects built from 2024 onward. Chess4All covers study, KnightMare covers machine learning, and this website with its tutoring page covers the coaching business.",
    purpose: "Gives players structured endgame study, a neural model trained on master games, and a way to find a coach, book sessions, and leave reviews.",
    role: "Built the endgame studies and navigation in HTML, CSS, and JavaScript, the PyTorch CNN and FEN-to-tensor pipeline, the Flask REST API behind booking, and the Firebase integration for profiles and reviews.",
    challenge: "The parts span very different kinds of work: hand-authored chess content, model training, scheduling data kept in both CSV and SQL, and live user data.",
    highlights: "A RESTful Flask API keeps CSV and SQL scheduling data in sync for session logistics. Firebase stores user profiles and a real-time database of coaching reviews and student feedback. The CNN was trained on GPUs through Modal.",
    features: ["30+ interactive endgame studies (Chess4All)", "Residual CNN trained on 100,000+ grandmaster games (KnightMare)", "Flask REST API for scheduling and logistics", "Firebase profiles and real-time coaching reviews", "Tutoring site with subjects, reviews, and inquiries"],
    outcome: "One place for all my chess work, from study material to the tools behind my coaching.",
    next: "Next step: link the pieces so study progress and coaching feedback shape each student’s next lesson.",
    tags: ["Python", "PyTorch", "Flask", "REST APIs", "Pandas", "Firebase", "Modal", "JavaScript"],
    primary: { label: "View GitHub ↗", href: "https://github.com/chessdudeo7/Grandmaster-Suite" },
    secondary: { label: "Tutoring site ↗", href: "tutoring.html" },
  },
  chess4all: {
    index: "PROJECT / 07",
    type: "Chess study website · Team project",
    title: "Chess4All",
    summary: "A website where chess players can study endgames, solve tactics puzzles, and replay famous master games.",
    context: "Built in 2024 by a three-person team (Matthew, Ethan, and Ray) as a Merivale High School computer science project, tracked through GitHub Classroom. I wrote the majority of the commits.",
    purpose: "Organizes endgame lessons into six families (pawn, rook, bishop, knight, queen, and material imbalance), with tactics puzzles, a master-games page, and Firebase-backed sign-up and login.",
    role: "Co-built the site: endgame study pages, navigation, puzzles, the master-games viewer, styling, and account pages.",
    challenge: "Writing 30+ study pages while keeping navigation and styling consistent meant building shared components, such as one navigation bar reused on every page.",
    highlights: "The interactive board started from an open-source chess.js and chess.css, which we credited and adapted to the site’s colours and needs. Firebase handles accounts.",
    features: ["30+ endgame study pages across six families", "Topics like opposition, zugzwang, pawn races, and bishop-and-knight mate", "Tactics puzzles", "Master-games collection", "Firebase sign-up and login"],
    outcome: "The site became the study half of Grandmaster Suite. Some endgame pages are still marked “Coming Soon”.",
    next: "Next steps: finish the remaining endgame pages and bring the older ones onto the final stylesheet.",
    tags: ["HTML", "CSS", "JavaScript", "Firebase"],
    primary: { label: "View GitHub ↗", href: "https://github.com/MHS-CSCE/sdp-chess4all" },
  },
  otmac: {
    index: "PROJECT / 08",
    type: "Contest website",
    title: "OTMaC Website",
    summary: "The public home of the Ottawa Math Team Contest, where students, parents, and teachers find contest information and preparation resources.",
    context: "The Ottawa Math Team Contest is a regional competition for high school students. As one of the organizers, I built and maintain the website as the contest’s shared source of truth.",
    purpose: "Covers the contest format, rules, eligibility, dates, registration, past papers, and announcements.",
    role: "Worked with the organizing team to gather requirements, then designed the layout, organized and wrote the content, and deployed it through GitHub Pages.",
    challenge: "The site has to speak clearly to students, parents, and teachers at once, and the code has to stay simple enough for other organizers to edit.",
    highlights: "A mobile-first layout, since many students check it on their phones. It is deployed under the OTMaC GitHub organization, so organizers can contribute updates through pull requests.",
    features: ["Contest format, rules, and key dates", "Registration guidance for teams", "Past papers and preparation resources", "Announcements for logistics and results", "Collaborative updates through GitHub"],
    outcome: "Gave the contest a single public home for its information, maintained collaboratively by the organizing team.",
    next: "Next steps: add archived results and simplify registration.",
    tags: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    primary: { label: "View GitHub ↗", href: "https://github.com/OTMaC/otmac.github.io" },
  },
};

const projectDialog = document.querySelector(".project-dialog");
const projectDialogFields = {
  index: document.getElementById("project-dialog-index"),
  type: document.getElementById("project-dialog-type"),
  title: document.getElementById("project-dialog-title"),
  summary: document.getElementById("project-dialog-summary"),
  context: document.getElementById("project-dialog-context"),
  purpose: document.getElementById("project-dialog-purpose"),
  role: document.getElementById("project-dialog-role"),
  challenge: document.getElementById("project-dialog-challenge"),
  highlights: document.getElementById("project-dialog-highlights"),
  features: document.getElementById("project-dialog-features"),
  outcome: document.getElementById("project-dialog-outcome"),
  next: document.getElementById("project-dialog-next"),
  tags: document.getElementById("project-dialog-tags"),
  primary: document.getElementById("project-dialog-primary"),
  secondary: document.getElementById("project-dialog-secondary"),
};

function setProjectUrl(projectId, mode = "push") {
  const url = new URL(location.href);
  if (projectId) url.searchParams.set("project", projectId);
  else url.searchParams.delete("project");
  history[`${mode}State`]({ project: projectId || null }, "", url);
}

function openProjectDialog(projectId, updateHistory = true) {
  const project = projectDetails[projectId];
  if (!project) return;

  ["index", "type", "title", "summary", "context", "purpose", "role", "challenge", "highlights", "outcome", "next"].forEach((field) => {
    projectDialogFields[field].textContent = project[field];
  });
  projectDialogFields.features.replaceChildren(...project.features.map((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    return item;
  }));
  projectDialogFields.tags.replaceChildren(...project.tags.map((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    return item;
  }));
  ["primary", "secondary"].forEach((field) => {
    const link = projectDialogFields[field];
    const linkDetails = project[field];
    link.hidden = !linkDetails;
    if (linkDetails) {
      link.textContent = linkDetails.label;
      link.href = linkDetails.href;
    }
  });
  if (!projectDialog.open) projectDialog.showModal();
  document.title = `${project.title} — Project by Matthew Zhu`;
  if (updateHistory && new URL(location.href).searchParams.get("project") !== projectId) {
    setProjectUrl(projectId);
  }
}

document.querySelectorAll("[data-project]").forEach((trigger) => {
  trigger.addEventListener("click", () => openProjectDialog(trigger.dataset.project));
});
function closeProjectDialog(updateHistory = true) {
  if (projectDialog.open) projectDialog.close();
  document.title = defaultDocumentTitle;
  if (updateHistory && new URL(location.href).searchParams.has("project")) setProjectUrl(null, "replace");
}

document.querySelector(".project-dialog-close").addEventListener("click", () => closeProjectDialog());
projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) closeProjectDialog();
});
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && projectDialog.open) {
    event.preventDefault();
    closeProjectDialog();
  }
});
projectDialog.addEventListener("close", () => {
  document.title = defaultDocumentTitle;
  if (new URL(location.href).searchParams.has("project")) setProjectUrl(null, "replace");
});
addEventListener("popstate", () => {
  const projectId = new URL(location.href).searchParams.get("project");
  if (projectDetails[projectId]) openProjectDialog(projectId, false);
  else closeProjectDialog(false);
});

const initialProjectId = new URL(location.href).searchParams.get("project");
if (projectDetails[initialProjectId]) openProjectDialog(initialProjectId, false);

const field = document.querySelector(".hero-field");
const fieldContext = field.getContext("2d");
const fieldPointer = { x: -1000, y: -1000 };
let fieldNodes = [];

function sizeField() {
  const bounds = field.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio, 2);
  field.width = bounds.width * density;
  field.height = bounds.height * density;
  fieldContext.setTransform(density, 0, 0, density, 0, 0);
  fieldNodes = Array.from({ length: bounds.width < 700 ? 22 : 46 }, (_, index) => ({
    x: (((index * 83) % 97) / 97) * bounds.width,
    y: (((index * 47) % 89) / 89) * bounds.height,
    phase: index * 0.73,
  }));
}

function drawField(time = 0) {
  const width = field.clientWidth;
  const height = field.clientHeight;
  fieldContext.clearRect(0, 0, width, height);
  const points = fieldNodes.map((node) => ({
    x: node.x + Math.sin(time * 0.00035 + node.phase) * 13,
    y: node.y + Math.cos(time * 0.00028 + node.phase) * 10,
  }));

  points.forEach((point, index) => {
    points.slice(index + 1).forEach((other) => {
      const distance = Math.hypot(point.x - other.x, point.y - other.y);
      if (distance < 135) {
        fieldContext.strokeStyle = `rgba(23,70,209,${(1 - distance / 135) * 0.18})`;
        fieldContext.beginPath();
        fieldContext.moveTo(point.x, point.y);
        fieldContext.lineTo(other.x, other.y);
        fieldContext.stroke();
      }
    });
    const pointerDistance = Math.hypot(point.x - fieldPointer.x, point.y - fieldPointer.y);
    fieldContext.fillStyle = pointerDistance < 150 ? "#e33d2e" : "#1746d1";
    const pointSize = pointerDistance < 150 ? 5 : 3;
    fieldContext.fillRect(point.x - 1.5, point.y - 1.5, pointSize, pointSize);
  });

  if (!reducedMotion) requestAnimationFrame(drawField);
}

field.addEventListener("pointermove", (event) => {
  const bounds = field.getBoundingClientRect();
  fieldPointer.x = event.clientX - bounds.left;
  fieldPointer.y = event.clientY - bounds.top;
  document.documentElement.style.setProperty("--hero-x", `${(event.clientX / innerWidth - .5) * 16}px`);
  document.documentElement.style.setProperty("--hero-y", `${(event.clientY / innerHeight - .5) * 12}px`);
});
window.addEventListener("resize", sizeField);
sizeField();
drawField();

document.querySelectorAll(".hobby").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".hobby.active")?.classList.remove("active");
    document.querySelectorAll(".hobby").forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    document.getElementById("hobby-output").textContent = button.dataset.output;
  });
});

if (finePointer && !reducedMotion) {
  const cursor = document.querySelector(".cursor");
  window.addEventListener("pointermove", (event) => {
    cursor.animate({ transform: `translate(${event.clientX - 6}px, ${event.clientY - 6}px)` }, { duration: 120, fill: "forwards" });
  });

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      element.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    element.addEventListener("pointerleave", () => { element.style.transform = ""; });
  });

  document.querySelectorAll(".project-visual").forEach((visual) => {
    visual.addEventListener("pointermove", (event) => {
      const bounds = visual.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - .5;
      const vertical = (event.clientY - bounds.top) / bounds.height - .5;
      visual.style.setProperty("--rx", `${vertical * -3}deg`);
      visual.style.setProperty("--ry", `${horizontal * 4}deg`);
    });
    visual.addEventListener("pointerleave", () => {
      visual.style.setProperty("--rx", "0deg");
      visual.style.setProperty("--ry", "0deg");
    });
  });
}
