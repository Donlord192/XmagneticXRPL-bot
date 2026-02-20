const backend = require("./backend");

let connected = false;
let seed = "";

const logBox = document.getElementById("log");

// Генерация seed grid

const grid = document.getElementById("seedGrid");

// если 8 слов
for(let i=1;i<=8;i++){
  const input = document.createElement("input");
  input.placeholder = i;
  grid.appendChild(input);
}

// LOG

function log(t){
  logBox.textContent += t+"\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// SEED
function saveSeed(){

  const inputs = grid.querySelectorAll("input");

  let parts = [];

  inputs.forEach(i=>{
    if(!i.value.trim()){
      log("❌ Fill all seed fields");
      throw new Error();
    }

    parts.push(i.value.trim());
  });

  seed = fixSeed(parts.join(""));

  localStorage.setItem("seed", seed);

  log("✅ Seed saved");
}

// LOAD
window.onload = ()=>{

  const s = localStorage.getItem("seed");

  if(!s) return;

  const size = Math.ceil(s.length / 8);

  const inputs = grid.querySelectorAll("input");

  for(let i=0;i<inputs.length;i++){

    inputs[i].value =
      s.substr(i*size,size) || "";
  }
};

function fixSeed(s){
  return s
    .replace(/\s+/g, "")
    .replace(/0/g, "o")
    .replace(/O/g, "o") // на всякий
    .trim();
}

// CONNECT

async function connect(){

  // ВСЕГДА пересохраняем перед коннектом
  saveSeed();

  if(!seed){
    log("No seed");
    return;
  }

  try{

    const acc = await backend.connectXRPL(seed);

    log("Seed OK");

    connected = true;

    document.getElementById("status").textContent="ONLINE";

    log("Connected: "+acc);

  }catch(e){

    log("Error: "+e.message);
  }
}

// BOT

async function start(){

  if(!connected) return;

  running = true;

  log("Bot started");

  loop();
}

function stop(){

  running = false;

  log("Stopped");
}

// LOOP

async function loop(){

  if(!running) return;

  try{

    const pair = document
  .getElementById("pair")
  .value
  .split("/")[0];
    const spread = parseFloat(
      document.getElementById("spread").value
    );

    // Issuers (реальные)

    const issuers = {

      USDC: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
      RLUSD: "rN74fd1bV2G7nPJw5n2N5y8JpMQNhhkG9Z",
      SOLO: "rsoLo2S1kiGeC4J9AciJwLeB4r4TtLZ1x",
      MAG: "rMgnXK5CZZ9yjwSp2hzv1b91Nk6GUp1dE2"

    };

    const issuer = issuers[pair];

    if(!issuer){
      log("Unknown issuer for "+pair);
      return;
    }

    const book = await backend.getBook(pair, issuer);

    if(!book.length){
      log("No orders in book");
      return;
    }

    const best = parseFloat(book[0].quality);

    await backend.cancelAll();

    await backend.placeBuy(
      5,
      best * (1 - spread/100),
      pair,
      issuer
    );

    log("Orders updated");

  }catch(e){

    console.error(e);

    log("BOT ERROR: "+e.message);
  }

  setTimeout(loop,10000);
}