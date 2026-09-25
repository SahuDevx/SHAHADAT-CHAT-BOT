const axios = require("axios");
const {
  createCanvas,
  loadImage,
  registerFont
} = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const FACEBOOK_ACCESS_TOKEN =
  "6628568379|c1e620fa708a1d5696fb991c1bde5662";

const UHAs_DIR =
  path.join(__dirname, "Uhas");

const CACHE_DIR =
  path.join(UHAs_DIR, "welcome");

const FONT_DIR =
  path.join(UHAs_DIR, "welcome-fonts");

const FONT_PATH =
  path.join(
    FONT_DIR,
    "NotoSansBengali-Regular.ttf"
  );

const FONT_URL =
  "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf";

let fontReady = false;
let currentDesign = 0;

module.exports.config = {
  name: "welcome",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "SHAHADAT SAHU",
  description:
    "Premium serial welcome banners",
  dependencies: {
    axios: "",
    canvas: "",
    "fs-extra": "",
    path: ""
  }
};

async function ensureFont() {
  if (fontReady) {
    return;
  }

  try {
    await fs.ensureDir(
      FONT_DIR
    );

    if (!fs.existsSync(FONT_PATH)) {
      const response =
        await axios.get(
          FONT_URL,
          {
            responseType:
              "arraybuffer",
            timeout: 30000
          }
        );

      await fs.writeFile(
        FONT_PATH,
        Buffer.from(
          response.data
        )
      );
    }

    registerFont(
      FONT_PATH,
      {
        family: "NotoBengali"
      }
    );

    fontReady = true;
  } catch (error) {
    console.error(
      "[WELCOME FONT ERROR]",
      error.message
    );
  }
}

function getNextDesign() {
  const design =
    currentDesign;

  currentDesign =
    (currentDesign + 1) % 4;

  return design;
}

async function getProfilePicture(
  userID
) {
  if (
    !userID ||
    !FACEBOOK_ACCESS_TOKEN ||
    FACEBOOK_ACCESS_TOKEN ===
      "YOUR_FACEBOOK_ACCESS_TOKEN"
  ) {
    return null;
  }

  try {
    const url =
      `https://graph.facebook.com/${encodeURIComponent(
        userID
      )}/picture` +
      "?width=2048" +
      "&height=2048" +
      "&type=large" +
      `&access_token=${encodeURIComponent(
        FACEBOOK_ACCESS_TOKEN
      )}`;

    const response =
      await axios.get(
        url,
        {
          responseType:
            "arraybuffer",
          timeout: 20000,
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    if (
      !response.data ||
      response.data.length < 100
    ) {
      return null;
    }

    return await loadImage(
      Buffer.from(
        response.data
      )
    );
  } catch (error) {
    console.error(
      `[WELCOME IMAGE ERROR: ${userID}]`,
      error.message
    );

    return null;
  }
}

function getUserInfoSafe(
  api,
  userID
) {
  return new Promise(
    resolve => {
      if (
        !api ||
        !userID ||
        typeof api.getUserInfo !==
          "function"
      ) {
        return resolve(null);
      }

      let completed = false;

      const done =
        (
          error,
          data
        ) => {
          if (completed) {
            return;
          }

          completed = true;

          if (error) {
            return resolve(null);
          }

          if (
            data &&
            data[userID]
          ) {
            return resolve(
              data[userID]
            );
          }

          if (
            data &&
            data.data &&
            data.data[userID]
          ) {
            return resolve(
              data.data[userID]
            );
          }

          resolve(
            data || null
          );
        };

      try {
        const result =
          api.getUserInfo(
            userID,
            done
          );

        if (
          result &&
          typeof result.then ===
            "function"
        ) {
          result.then(
            data =>
              done(
                null,
                data
              ),
            error =>
              done(
                error
              )
          );
        }
      } catch (error) {
        done(error);
      }
    }
  );
}

function getOrdinal(
  number
) {
  const n =
    Number(number);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return "Member";
  }

  const lastTwo =
    n % 100;

  if (
    lastTwo >= 11 &&
    lastTwo <= 13
  ) {
    return `${n}th Member`;
  }

  if (n % 10 === 1) {
    return `${n}st Member`;
  }

  if (n % 10 === 2) {
    return `${n}nd Member`;
  }

  if (n % 10 === 3) {
    return `${n}rd Member`;
  }

  return `${n}th Member`;
}

function fitText(
  ctx,
  text,
  maxWidth,
  startSize,
  family = "Arial",
  weight = "bold"
) {
  const value =
    String(text || "");

  let size =
    startSize;

  while (size > 12) {
    ctx.font =
      `${weight} ${size}px ${family}`;

    if (
      ctx.measureText(
        value
      ).width <= maxWidth
    ) {
      return size;
    }

    size -= 2;
  }

  return 12;
}

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    );

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );

  ctx.closePath();
}

function drawCoverImage(
  ctx,
  image,
  x,
  y,
  width,
  height
) {
  if (!image) {
    return;
  }

  const scale =
    Math.max(
      width / image.width,
      height / image.height
    );

  const drawWidth =
    image.width * scale;

  const drawHeight =
    image.height * scale;

  ctx.drawImage(
    image,
    x +
      (width -
        drawWidth) /
        2,
    y +
      (height -
        drawHeight) /
        2,
    drawWidth,
    drawHeight
  );
}

function drawAvatar(
  ctx,
  image,
  x,
  y,
  radius,
  accent,
  fallback
) {
  ctx.save();

  ctx.globalAlpha = 1;
  ctx.shadowColor =
    "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 5,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.48)";

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 2,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(255,255,255,0.22)";

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.clip();

  if (image) {
    drawCoverImage(
      ctx,
      image,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );
  } else {
    ctx.fillStyle =
      fallback ||
      "#202020";

    ctx.fillRect(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );

    ctx.fillStyle =
      "rgba(255,255,255,0.48)";

    ctx.beginPath();

    ctx.arc(
      x,
      y -
        radius * 0.22,
      radius * 0.22,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      x,
      y +
        radius * 0.38,
      radius * 0.45,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();

  ctx.save();

  ctx.globalAlpha =
    0.70;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 2,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    accent;

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.restore();
}

function drawParticles(
  ctx,
  width,
  height,
  color,
  count = 25
) {
  ctx.save();

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const x =
      Math.random() *
      width;

    const y =
      Math.random() *
      height;

    const size =
      Math.random() *
        1.4 +
      0.5;

    ctx.globalAlpha =
      0.025 +
      Math.random() *
        0.06;

    ctx.fillStyle =
      color;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();

  ctx.globalAlpha = 1;
}

function drawDotGrid(
  ctx,
  x,
  y,
  columns,
  rows,
  gap,
  color
) {
  ctx.save();

  ctx.fillStyle =
    color;

  for (
    let row = 0;
    row < rows;
    row++
  ) {
    for (
      let col = 0;
      col < columns;
      col++
    ) {
      ctx.globalAlpha =
        0.14;

      ctx.beginPath();

      ctx.arc(
        x +
          col * gap,
        y +
          row * gap,
        1.3,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  ctx.restore();

  ctx.globalAlpha = 1;
}

function drawBorder(
  ctx,
  width,
  height,
  color
) {
  ctx.strokeStyle =
    color;

  ctx.lineWidth = 1.5;

  ctx.strokeRect(
    28,
    28,
    width - 56,
    height - 56
  );
}

function drawAddedBy(
  ctx,
  name,
  avatar,
  x,
  y,
  width,
  accent
) {
  const height = 66;

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,0.36)";

  roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    33
  );

  ctx.fill();

  ctx.strokeStyle =
    accent;

  ctx.globalAlpha =
    0.30;

  ctx.lineWidth = 1;

  roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    33
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  drawAvatar(
    ctx,
    avatar,
    x + 34,
    y + 33,
    24,
    accent,
    "#202020"
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    "rgba(255,255,255,0.48)";

  ctx.font =
    "bold 9px Arial";

  ctx.fillText(
    "ADDED BY",
    x + 67,
    y + 20
  );

  const addedName =
    String(
      name ||
        "Group Admin"
    );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    `bold ${fitText(
      ctx,
      addedName,
      width - 90,
      17,
      "NotoBengali"
    )}px NotoBengali`;

  ctx.fillText(
    addedName.length > 25
      ? addedName.substring(
          0,
          22
        ) + "..."
      : addedName,
    x + 67,
    y + 42
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.28)";

  ctx.font =
    "8px Arial";

  ctx.fillText(
    "THANK YOU FOR ADDING OUR NEW MEMBER",
    x + 67,
    y + 56
  );

  ctx.restore();
}

function backgroundCyan(
  ctx,
  w,
  h
) {
  const bg =
    ctx.createLinearGradient(
      0,
      0,
      w,
      h
    );

  bg.addColorStop(
    0,
    "#061827"
  );

  bg.addColorStop(
    0.45,
    "#0b3d5a"
  );

  bg.addColorStop(
    1,
    "#061523"
  );

  ctx.fillStyle =
    bg;

  ctx.fillRect(
    0,
    0,
    w,
    h
  );

  ctx.fillStyle =
    "rgba(40,145,205,0.10)";

  ctx.beginPath();

  ctx.moveTo(
    0,
    0
  );

  ctx.lineTo(
    430,
    0
  );

  ctx.lineTo(
    120,
    h
  );

  ctx.lineTo(
    0,
    h
  );

  ctx.closePath();

  ctx.fill();

  ctx.strokeStyle =
    "rgba(85,214,255,0.30)";

  ctx.lineWidth = 2;

  for (
    let i = 0;
    i < 5;
    i++
  ) {
    ctx.beginPath();

    ctx.moveTo(
      820 +
        i * 30,
      0
    );

    ctx.quadraticCurveTo(
      1010,
      80 +
        i * 18,
      w,
      250 +
        i * 45
    );

    ctx.stroke();
  }

  drawDotGrid(
    ctx,
    1020,
    180,
    5,
    5,
    15,
    "#55d6ff"
  );

  drawParticles(
    ctx,
    w,
    h,
    "#9feaff",
    28
  );
}

function backgroundOrange(
  ctx,
  w,
  h
) {
  const bg =
    ctx.createLinearGradient(
      0,
      0,
      w,
      h
    );

  bg.addColorStop(
    0,
    "#1c0c04"
  );

  bg.addColorStop(
    0.50,
    "#61300f"
  );

  bg.addColorStop(
    1,
    "#180a03"
  );

  ctx.fillStyle =
    bg;

  ctx.fillRect(
    0,
    0,
    w,
    h
  );

  ctx.fillStyle =
    "rgba(255,137,42,0.10)";

  ctx.beginPath();

  ctx.moveTo(
    0,
    0
  );

  ctx.lineTo(
    470,
    0
  );

  ctx.lineTo(
    0,
    420
  );

  ctx.closePath();

  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,180,92,0.42)";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    -50,
    560
  );

  ctx.lineTo(
    500,
    0
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    50,
    600
  );

  ctx.lineTo(
    630,
    0
  );

  ctx.stroke();

  ctx.strokeStyle =
    "rgba(255,180,92,0.18)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    680,
    600
  );

  ctx.lineTo(
    1200,
    80
  );

  ctx.stroke();

  drawDotGrid(
    ctx,
    980,
    95,
    5,
    5,
    15,
    "#ffb45c"
  );

  drawParticles(
    ctx,
    w,
    h,
    "#ffd19a",
    25
  );
}

function backgroundPurple(
  ctx,
  w,
  h
) {
  const bg =
    ctx.createLinearGradient(
      0,
      0,
      w,
      h
    );

  bg.addColorStop(
    0,
    "#100821"
  );

  bg.addColorStop(
    0.48,
    "#38205c"
  );

  bg.addColorStop(
    1,
    "#12091f"
  );

  ctx.fillStyle =
    bg;

  ctx.fillRect(
    0,
    0,
    w,
    h
  );

  ctx.fillStyle =
    "rgba(140,70,220,0.12)";

  ctx.beginPath();

  ctx.moveTo(
    w,
    0
  );

  ctx.lineTo(
    800,
    0
  );

  ctx.lineTo(
    1050,
    280
  );

  ctx.lineTo(
    w,
    350
  );

  ctx.closePath();

  ctx.fill();

  ctx.strokeStyle =
    "rgba(201,155,255,0.42)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.arc(
    1050,
    440,
    260,
    3.4,
    5.8
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    990,
    90,
    105,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  drawDotGrid(
    ctx,
    1110,
    80,
    4,
    4,
    16,
    "#c99bff"
  );

  drawParticles(
    ctx,
    w,
    h,
    "#ead7ff",
    25
  );
}

function backgroundBurgundy(
  ctx,
  w,
  h
) {
  const bg =
    ctx.createLinearGradient(
      0,
      0,
      w,
      h
    );

  bg.addColorStop(
    0,
    "#19050a"
  );

  bg.addColorStop(
    0.48,
    "#581522"
  );

  bg.addColorStop(
    1,
    "#170408"
  );

  ctx.fillStyle =
    bg;

  ctx.fillRect(
    0,
    0,
    w,
    h
  );

  ctx.fillStyle =
    "rgba(180,35,65,0.09)";

  ctx.beginPath();

  ctx.moveTo(
    0,
    0
  );

  ctx.lineTo(
    420,
    0
  );

  ctx.lineTo(
    0,
    420
  );

  ctx.closePath();

  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,92,118,0.34)";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    250,
    600
  );

  ctx.lineTo(
    850,
    0
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    400,
    600
  );

  ctx.lineTo(
    1000,
    0
  );

  ctx.stroke();

  ctx.strokeStyle =
    "rgba(255,92,118,0.15)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    620,
    600
  );

  ctx.lineTo(
    1200,
    20
  );

  ctx.stroke();

  drawDotGrid(
    ctx,
    1060,
    95,
    5,
    5,
    15,
    "#ff7184"
  );

  drawParticles(
    ctx,
    w,
    h,
    "#ffb3bd",
    26
  );
}

function designOne(
  ctx,
  data,
  accent,
  backgroundType
) {
  const {
    userName,
    groupName,
    memberCount,
    memberAvatar,
    addedByName,
    addedByAvatar
  } = data;

  const family =
    fontReady
      ? "NotoBengali"
      : "Arial";

  if (
    backgroundType ===
    "orange"
  ) {
    backgroundOrange(
      ctx,
      1200,
      600
    );
  } else {
    backgroundCyan(
      ctx,
      1200,
      600
    );
  }

  drawAvatar(
    ctx,
    memberAvatar,
    205,
    310,
    103,
    accent,
    backgroundType ===
      "orange"
      ? "#4c270d"
      : "#15384f"
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    "rgba(255,255,255,0.62)";

  ctx.font =
    "bold 13px Arial";

  ctx.fillText(
    "NEW MEMBER",
    420,
    118
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 61px Arial";

  ctx.fillText(
    "WELCOME",
    420,
    180
  );

  const name =
    String(
      userName ||
        "New Member"
    );

  ctx.fillStyle =
    accent;

  ctx.font =
    `bold ${fitText(
      ctx,
      name,
      700,
      39,
      family
    )}px ${family}`;

  ctx.fillText(
    name,
    420,
    230
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.68)";

  ctx.font =
    "17px Arial";

  ctx.fillText(
    "A new member has joined the community",
    420,
    268
  );

  ctx.strokeStyle =
    accent;

  ctx.globalAlpha =
    0.45;

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    420,
    300
  );

  ctx.lineTo(
    1120,
    300
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  ctx.fillStyle =
    "rgba(255,255,255,0.42)";

  ctx.font =
    "10px Arial";

  ctx.fillText(
    "GROUP",
    420,
    340
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    `bold ${fitText(
      ctx,
      groupName,
      350,
      21,
      family
    )}px ${family}`;

  ctx.fillText(
    String(groupName),
    420,
    375
  );

  ctx.textAlign =
    "right";

  ctx.fillStyle =
    "rgba(255,255,255,0.42)";

  ctx.font =
    "10px Arial";

  ctx.fillText(
    "MEMBER",
    1090,
    340
  );

  ctx.fillStyle =
    accent;

  ctx.font =
    "bold 22px Arial";

  ctx.fillText(
    getOrdinal(memberCount),
    1090,
    375
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    "rgba(255,255,255,0.55)";

  ctx.font =
    "16px Arial";

  ctx.fillText(
    "WELCOME TO THE FAMILY",
    420,
    425
  );

  ctx.fillStyle =
    accent;

  ctx.font =
    "bold 14px Arial";

  ctx.fillText(
    "CONNECT • RESPECT • ENJOY • STAY TOGETHER",
    420,
    455
  );

  drawAddedBy(
    ctx,
    addedByName,
    addedByAvatar,
    420,
    495,
    630,
    accent
  );
}

function designTwo(
  ctx,
  data,
  accent,
  backgroundType
) {
  const {
    userName,
    groupName,
    memberCount,
    memberAvatar,
    addedByName,
    addedByAvatar
  } = data;

  const family =
    fontReady
      ? "NotoBengali"
      : "Arial";

  if (
    backgroundType ===
    "burgundy"
  ) {
    backgroundBurgundy(
      ctx,
      1200,
      600
    );
  } else {
    backgroundPurple(
      ctx,
      1200,
      600
    );
  }

  drawAvatar(
    ctx,
    memberAvatar,
    1000,
    165,
    103,
    accent,
    backgroundType ===
      "burgundy"
      ? "#351018"
      : "#302047"
  );

  ctx.textAlign =
    "left";

  ctx.fillStyle =
    "rgba(255,255,255,0.65)";

  ctx.font =
    "bold 13px Arial";

  ctx.fillText(
    "NEW MEMBER",
    100,
    112
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 61px Arial";

  ctx.fillText(
    "WELCOME",
    100,
    175
  );

  const name =
    String(
      userName ||
        "New Member"
    );

  ctx.fillStyle =
    accent;

  ctx.font =
    `bold ${fitText(
      ctx,
      name,
      720,
      39,
      family
    )}px ${family}`;

  ctx.fillText(
    name,
    100,
    225
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.68)";

  ctx.font =
    "17px Arial";

  ctx.fillText(
    "A new member has joined the community",
    100,
    262
  );

  ctx.strokeStyle =
    accent;

  ctx.globalAlpha =
    0.40;

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    100,
    292
  );

  ctx.lineTo(
    870,
    292
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  ctx.fillStyle =
    "rgba(255,255,255,0.11)";

  roundedRect(
    ctx,
    100,
    325,
    690,
    82,
    22
  );

  ctx.fill();

  ctx.strokeStyle =
    accent;

  ctx.globalAlpha =
    0.38;

  ctx.lineWidth = 1;

  roundedRect(
    ctx,
    100,
    325,
    690,
    82,
    22
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  ctx.fillStyle =
    "rgba(255,255,255,0.45)";

  ctx.font =
    "10px Arial";

  ctx.fillText(
    "GROUP",
    130,
    350
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    `bold ${fitText(
      ctx,
      groupName,
      310,
      20,
      family
    )}px ${family}`;

  ctx.fillText(
    String(groupName),
    130,
    383
  );

  ctx.strokeStyle =
    accent;

  ctx.globalAlpha =
    0.28;

  ctx.beginPath();

  ctx.moveTo(
    455,
    340
  );

  ctx.lineTo(
    455,
    393
  );

  ctx.stroke();

  ctx.globalAlpha = 1;

  ctx.fillStyle =
    "rgba(255,255,255,0.45)";

  ctx.font =
    "10px Arial";

  ctx.fillText(
    "MEMBER",
    490,
    350
  );

  ctx.fillStyle =
    accent;

  ctx.font =
    "bold 20px Arial";

  ctx.fillText(
    getOrdinal(memberCount),
    490,
    383
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.58)";

  ctx.font =
    "italic 16px Arial";

  ctx.fillText(
    "GOOD PEOPLE • BETTER COMMUNITY",
    100,
    445
  );

  ctx.fillStyle =
    accent;

  ctx.font =
    "bold 14px Arial";

  ctx.fillText(
    "CONNECT • RESPECT • ENJOY • STAY TOGETHER",
    100,
    472
  );

  drawAddedBy(
    ctx,
    addedByName,
    addedByAvatar,
    430,
    505,
    650,
    accent
  );
}

async function createWelcomeBanner(
  userID,
  userName,
  groupName,
  memberCount,
  addedByID,
  addedByName
) {
  await fs.ensureDir(
    CACHE_DIR
  );

  await ensureFont();

  const width = 1200;
  const height = 600;

  const canvas =
    createCanvas(
      width,
      height
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  const design =
    getNextDesign();

  const [
    memberAvatar,
    addedByAvatar
  ] =
    await Promise.all([
      getProfilePicture(
        userID
      ),
      getProfilePicture(
        addedByID
      )
    ]);

  const data = {
    userName,
    groupName,
    memberCount,
    memberAvatar,
    addedByName,
    addedByAvatar
  };

  if (design === 0) {
    designOne(
      ctx,
      data,
      "#55d6ff",
      "cyan"
    );

    drawBorder(
      ctx,
      width,
      height,
      "rgba(85,214,255,0.42)"
    );
  } else if (design === 1) {
    designOne(
      ctx,
      data,
      "#ffb45c",
      "orange"
    );

    drawBorder(
      ctx,
      width,
      height,
      "rgba(255,180,92,0.44)"
    );
  } else if (design === 2) {
    designTwo(
      ctx,
      data,
      "#c99bff",
      "purple"
    );

    drawBorder(
      ctx,
      width,
      height,
      "rgba(201,155,255,0.42)"
    );
  } else {
    designTwo(
      ctx,
      data,
      "#ff7184",
      "burgundy"
    );

    drawBorder(
      ctx,
      width,
      height,
      "rgba(255,113,132,0.42)"
    );
  }

  const imagePath =
    path.join(
      CACHE_DIR,
      `welcome_${Date.now()}_${String(
        userID
      )}_${design}.png`
    );

  await fs.writeFile(
    imagePath,
    canvas.toBuffer(
      "image/png"
    )
  );

  return imagePath;
}

module.exports.run =
  async function ({
    api,
    event
  }) {
    try {
      if (!event) {
        return;
      }

      if (
        event.logMessageType &&
        event.logMessageType !==
          "log:subscribe"
      ) {
        return;
      }

      const data =
        event.logMessageData;

      if (
        !data ||
        !Array.isArray(
          data.addedParticipants
        ) ||
        !data.addedParticipants
          .length
      ) {
        return;
      }

      const threadID =
        event.threadID;

      if (!threadID) {
        return;
      }

      const botID =
        String(
          api.getCurrentUserID()
        );

      const participants =
        data.addedParticipants;

      const botJoined =
        participants.some(
          participant =>
            String(
              participant.userFbId
            ) === botID
        );

      if (botJoined) {
        return;
      }

      const threadInfo =
        await api.getThreadInfo(
          threadID
        );

      const groupName =
        threadInfo &&
        threadInfo.threadName
          ? threadInfo.threadName
          : "Group Chat";

      const memberCount =
        threadInfo &&
        Array.isArray(
          threadInfo.participantIDs
        )
          ? threadInfo
              .participantIDs
              .length
          : 0;

      const addedByID =
        event.author ||
        event.senderID ||
        data.author ||
        null;

      let addedByName =
        "Group Admin";

      if (addedByID) {
        const info =
          await getUserInfoSafe(
            api,
            addedByID
          );

        if (info) {
          addedByName =
            info.name ||
            info.fullName ||
            info.firstName ||
            "Group Admin";
        }
      }

      for (
        const participant of
          participants
      ) {
        const userID =
          participant.userFbId;

        if (!userID) {
          continue;
        }

        const userName =
          participant.fullName ||
          participant.name ||
          "New Member";

        let imagePath =
          null;

        try {
          imagePath =
            await createWelcomeBanner(
              userID,
              userName,
              groupName,
              memberCount,
              addedByID,
              addedByName
            );

          const messageBody =
`╭•┄┅═══❁🌺❁═══┅┄•╮
     আসসালামু আলাইকুম 💚
╰•┄┅═══❁🌺❁═══┅┄•╯

হাসি, মজা, ঠাট্টায় গড়ে উঠুক
চিরস্থায়ী বন্ধুত্বের বন্ধন।🥰
ভালোবাসা ও সম্পর্ক থাকুক আজীবন।💝

➤ আশা করি আপনি এখানে হাসি-মজা করে
আড্ডা দিতে ভালোবাসবেন।😍
➤ সবার সাথে মিলেমিশে থাকবেন।😉
➤ উস্কানিমূলক কথা বা খারাপ ব্যবহার করবেন না।🚫
➤ গ্রুপ অ্যাডমিনের কথা শুনবেন ও নিয়ম মেনে চলবেন।✅

›› প্রিয় ${userName},
আপনি ${groupName} গ্রুপের ${memberCount} নম্বর মেম্বার! 🎉

🌺 শুভেচ্ছা — ◈━━꯭${global.config.BOTNAME}꯭━━◈`;

          await new Promise(
            (
              resolve,
              reject
            ) => {
              const stream =
                fs.createReadStream(
                  imagePath
                );

              stream.on(
                "error",
                reject
              );

              api.sendMessage(
                {
                  body:
                    messageBody,
                  attachment:
                    stream,
                  mentions: [
                    {
                      tag:
                        userName,
                      id:
                        userID
                    }
                  ]
                },
                threadID,
                error => {
                  try {
                    stream.destroy();
                  } catch {}

                  if (error) {
                    reject(
                      error
                    );
                    return;
                  }

                  resolve();
                }
              );
            }
          );
        } catch (error) {
          console.error(
            "[WELCOME SEND ERROR]",
            error
          );
        } finally {
          if (
            imagePath &&
            fs.existsSync(
              imagePath
            )
          ) {
            await fs.remove(
              imagePath
            ).catch(
              () => {}
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "[WELCOME ERROR]",
        error
      );
    }
  };
