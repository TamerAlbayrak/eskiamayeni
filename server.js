const express = require("express");
const { Client, Util } = require("discord.js");
const http = require("http");
const bookman = require("bookman");
const handlebars = require("express-handlebars");
const url = require("url");
const Discord = require("discord.js");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const handlebarshelpers = require("handlebars-helpers")();
const path = require("path");
const fs = require("fs");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const session = require("express-session");
const client = new Discord.Client();
const randomString = require("random-string");
//const db = (global.db = {});
const ayarlar = require("./ayarlar.json");
const config = require("./ayarlar.json");
const chalk = require("chalk");
require("./util/eventLoader.js")(client);
const db = require("quick.db");

let ranks = [
  "normal",
  "altin",
  "elmas",
  "hazir",
  "sistemler",
  "topluluk",
  "api"
];
for (let rank in ranks) {
  db[ranks[rank]] = new bookman(ranks[rank]);
}
const IDler = {
  botID: "785803944374829066",
  botSecret: "Sax09RSPGey1mURGd-MGBOjPZo-1aXgW",
  botCallbackURL: "https://www.hatipogluarsiv.tk/callback",
  sunucuID: "346329027126231041",
  sunucuDavet: "https://discord.gg/K8X7hFw",
  kodLogKanalı: "693079634782322688",
  sahipRolü: "743464612099260599",
  adminRolü: "773169580741754901",
  kodPaylaşımcıRolü: "706474163065454592",
  boosterRolü: "760212219068678144",
  kodPaylaşamayacakRoller: ["389475876380868628", "786141643396349962"],
  hazırAltyapılarRolü: "786154031609282580",
  hazırSistemlerRolü: "786154031609282580",
  sistemlerrolü: "785807491593928714",
  elmasKodlarRolü: "785807491593928714",
  altınKodlarRolü: ["389475876380868628", "699176536716345344"],
  normalKodlarRolü: ["389475876380868628", "699176536716345344"]
};
const app = express();

//----------üstü---ellemeyin------------

//handler

client.on("message", message => {
  const prefix = ".ayarlar.prefix"; 
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(prefix)
  )
    return;
  const args = message.content
    .slice(1)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmd =
    client.commands.get(command) ||
    client.commands.get(client.aliases.get(command));
  if (!cmd) return;
  cmd.run(client, message, args);
});

client.on("ready", () => {
  const listener = app.listen(process.env.PORT, function() {
    client.user.setActivity(
      `Hatipoğlu İle Arşiv. https://www.hatipogluarsiv.tk/ `,
      { type: "WATCHING" }
    );
    console.log("Proje Hazır!");
  });
});

const moment = require("moment");

const log = message => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
};

process.on("unhandledRejection", error => {
  console.error("API Hatası:", error);
});

client.on("error", error => {
  console.error("WebSocket bir hatayla karşılaştı:", error);
});

client.on("ready", async () => {
  client.appInfo = await client.fetchApplication();
  setInterval(async () => {
    client.appInfo = await client.fetchApplication();
  }, 600);
});

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`Knavenin Komutları ${files.length} bu kdr simdi yuklenio`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Hatipoğlu: ${props.help.name}`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }

  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });
client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});
client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.yetkiler = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = -ayarlar.varsayilanperm;
  if (message.member.hasPermission("MANAGE_MESSAGES")) permlvl = 1;
  if (message.member.hasPermission("KICK_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 3;
  if (message.member.hasPermission("MANAGE_GUILD")) permlvl = 4;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 5;
  if (message.author.id === message.guild.ownerID) permlvl = 6;
  if (message.author.id === ayarlar.sahip) permlvl = 7;
  return permlvl;
};
//komutlar-----------------
  client.on("message", async(msg) => {

        if (msg.content === "ping") {
            msg.channel.send(`${client.ws.ping}`)
        } else return;
    })﻿
    /////----------------------------------------------------------------------------------------------/////

/////----------------------------------------------------------------------------------------------/////

client.on("guildMemberAdd", async member => {
  // can#0002

  const database = require("quick.db");
  if (member.user.bot) return;

  const kanal = member.guild.channels.cache.get(
    (await database.fetch(`fake-channel.${member.guild.id}`)) || 0
  );
  const zaman = await database.fetch(`fake-time.${member.guild.id}`);
  const rol = member.guild.roles.cache.get(
    (await database.fetch(`fake-role.${member.guild.id}`)) || 0
  );
  if (!kanal || !zaman || !rol) return;

  if (member.user.createdAt.getTime() < require("ms")(zaman)) {
    member.roles.add(rol.id);
    const embed = new Discord.MessageEmbed()
      .setColor("BLUE")
      .setTitle("Fake Tetikleyici")
      .setDescription(`**${member.user.tag}** Fake sistemine takıldı!`);
    return kanal.send(embed);
  } else return;
}); // codare

//dmlog

client.on("message", msg => {
  var dm = client.channels.cache.get("665458415031549952");
  if (msg.channel.type === "dm") {
    if (msg.author.id === client.user.id) return;
    const botdm = new Discord.MessageEmbed()
      .setTitle(`${client.user.username} Dm`)
      .setTimestamp()
      .setColor("RED")
      .setThumbnail(`${msg.author.avatarURL()}`)
      .addField("Gönderen", msg.author.tag)
      .addField("Gönderen ID", msg.author.id)
      .addField("Gönderilen Mesaj", msg.content);

    dm.send(botdm);
  }
  if (msg.channel.bot) return;
});

client.on("messageDelete", message => {
  const emirhan = require("quick.db");
  emirhan.set(`snipe.mesaj.${message.guild.id}`, message.content);
  emirhan.set(`snipe.id.${message.guild.id}`, message.author.id);
});

//sesli

client.on("ready", async message => {
  const channel = client.channels.cache.get("761243642958315540");
  if (!channel) return console.error("Kanal 'ID' girilmemiş.");
  channel
    .join()
    .then(connection => {
      connection.voice.setSelfDeaf(true);
      console.log("Başarıyla bağlanıldı.");
    })
    .catch(e => {
      console.error(e);
    });
});

//raid

client.on("guildMemberAdd", async member => {
  let kanal = await db.fetch(`antiraidK_${member.guild.id}`);
  if (!kanal) return;
  const gözelkanal = client.channels.cache.get(kanal);
  if (!gözelkanal) return;
  if (member.user.bot == true) {
    if (db.fetch(`botizin_${member.guild.id}.${member.id}`) == "aktif") {
      gözelkanal.send(
        "**" +
          member.user.username +
          "** adlı bota bir yetkili izin verdi eğer kaldırmak istiyorsanız **!bot-izni-kaldır botunid**."
      );
    } else {
      gözelkanal.send(
        "**" +
          member.user.username +
          "** adlı botu güvenlik amacı ile uzaklaştırdım. Tekrar geldiğinde uzaklaştırılmasını istemiyorsanız **!bot-izni-ver botunid**"
      );
      member.ban();
    }
  }
});

//prefix

client.on("message", msg => {
  if (msg.content === "<@!785803944374829066>") {
    msg.channel.send(
      `<@!${msg.author.id}> **My Prefix is**   ${ayarlar.prefix}`
    );
  }
});

//otorol
client.on("guildMemberAdd", member => {
  member.roles.add("561991429132386350"); // UNREGİSTER ROLÜNÜN İDSİNİ GİRİN
});

//fakeüye

client.on("guildMemberAdd", member => {
  var moment = require("moment");
  require("moment-duration-format");
  moment.locale("tr");
  var { Permissions } = require("discord.js");
  var x = moment(member.user.createdAt)
    .add(7, "days")
    .fromNow();
  var user = member.user;
  x = x.replace("birkaç saniye önce", " ");
  if (!x.includes("önce") || x.includes("sonra") || x == " ") {
    const kytsz = member.guild.roles.cache.find(
      r => r.id === "561991429132386350"
    );
    var rol = member.guild.roles.cache.get("662559486971478036"); // ŞÜPHELİ HESAP ROLÜNÜN İDSİNİ GİRİN
    var kayıtsız = member.guild.roles.cache.get(561991429132386350); // UNREGİSTER ROLÜNÜN İDSİNİ GİRİN
    member.roles.add(rol);
    member.roles.remove(kytsz);

    member.user.send(
      "Selam Dostum Ne Yazık ki Sana Kötü Bir Haberim Var Hesabın 1 Hafta Gibi Kısa Bir Sürede Açıldığı İçin Fake Hesap Katagorisine Giriyorsun Lütfen Bir Yetkiliyle İletişime Geç Onlar Sana Yardımcı Olucaktır."
    );
    setTimeout(() => {}, 1000);
  } else {
  }
});

//yedek

const backup = () => {
  fs.copyFile(
    "./json.sqlite",
    `./backups/yedekleme • ${moment().format(
      "D-M-YYYY • H.mm.ss"
    )} • laura.sqlite`,
    err => {
      if (err) return console.log(err);
      console.log("Veritabanını yedekledim.");
    }
  );
};

client.on("ready", () => {
  setInterval(() => backup(), 1000 * 60 * 60 * 24); // Günde bir kere yedekler.
});

//snipe
client.on("messageDelete", async message => {
  // can#0002
  if (message.author.bot || !message.content) return;
  require("quick.db").push(message.guild.id, {
    author: message.author,
    authorTAG: message.author.tag,
    authorID: message.author.id,
    authorUSERNAME: message.author.username,
    authorDISCRIMINATOR: message.author.discriminator,
    messageID: message.id,
    messageCHANNEL: message.channel,
    messageCHANNELID: message.channel.id,
    messageCONTENT: message.content,
    messageCREATEDAT: message.createdAt
  });
}); // codare ♥

client.on("voiceStateUpdate", (oldState, newState) => {
  // todo create channel
  if (
    newState.voiceChannel != null &&
    newState.voiceChannel.name.startsWith("➕│Oda oluştur")
  ) {
    newState.guild
      .createChannel(`║👤 ${newState.displayName}`, {
        type: "voice",
        parent: newState.voiceChannel.parent
      })
      .then(cloneChannel => {
        newState.setVoiceChannel(cloneChannel);
        cloneChannel.setUserLimit(0);
      });
  }

  // ! leave
  if (oldState.voiceChannel != undefined) {
    if (oldState.voiceChannel.name.startsWith("║👤 ")) {
      if (oldState.voiceChannel.members.size == 0) {
        oldState.voiceChannel.delete();
      } else {
        // change name
        let matchMember = oldState.voiceChannel.members.find(
          x => `║👤 ${x.displayName}` == oldState.voiceChannel.name
        );
        if (matchMember == null) {
          oldState.voiceChannel.setName(
            `║👤 ${oldState.voiceChannel.members.random().displayName}`
          );
        }
      }
    }
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕・2 Kişilik Oda")
  ) {
    newState.guild.channels
      .create(`🎧・${newState.member.displayName} Odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(2);
      });
  }
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕・3 Kişilik Oda")
  ) {
    newState.guild.channels
      .create(`🎧・${newState.member.displayName} Odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(3);
      });
  }
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕・4 Kişilik Oda")
  ) {
    newState.guild.channels
      .create(`🎧・${newState.member.displayName} Odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(4);
      });
  }
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕・5 Kişilik Oda")
  ) {
    newState.guild.channels
      .create(`🎧・${newState.member.displayName} Odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(5);
      });
  }
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕│Oda oluştur")
  ) {
    newState.guild.channels
      .create(`🎧・${newState.member.displayName} Odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(0);
      });
  }
  if (
    newState.channel != null &&
    newState.channel.name.startsWith("➕│Ağlama odası")
  ) {
    newState.guild.channels
      .create(`🎧・Ağlama odası`, {
        type: "voice",
        parent: newState.channel.parent
      })
      .then(cloneChannel => {
        newState.setChannel(cloneChannel);
        cloneChannel.setUserLimit(1);
      });
  }
  // Kullanıcı ses kanalından ayrılınca ve kanalda kimse kalmazsa kanalı siler;
  if (oldState.channel != undefined) {
    if (oldState.channel.name.startsWith("🎧・")) {
      if (oldState.channel.members.size == 0) {
        oldState.channel.delete();
      } else {
        // İlk kullanıcı ses kanalından ayrılınca kanaldaki başka kullanıcı adını kanal adı yapar.
        let matchMember = oldState.channel.members.find(
          x => `🎧・${x.displayName} Odası` == oldState.channel.name
        );
        if (matchMember == null) {
          oldState.channel.setName(
            `🎧・${oldState.channel.members.random().displayName} Odası`
          );
        }
      }
    }
  }
});

//site--------------------------------------------------------------
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false
  })
);
app.use(cookieParser());
app.engine(
  "handlebars",
  handlebars({
    defaultLayout: "main",
    layoutsDir: `${__dirname}/views/layouts/`,
    helpers: handlebarshelpers
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "handlebars");
app.use(express.static(__dirname + "/public"));
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
const scopes = ["identify", "guilds"];
passport.use(
  new Strategy(
    {
      clientID: IDler.botID,
      clientSecret: IDler.botSecret,
      callbackURL: IDler.botCallbackURL,
      scope: scopes
    },
    (accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    }
  )
);
app.use(
  session({
    secret: "secret-session-thing",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/giris",
  passport.authenticate("discord", {
    scope: scopes
  })
);
app.get(
  "/callback",
  passport.authenticate("discord", {
    failureRedirect: "/error"
  }),
  (req, res) => {
    res.redirect("/");
  }
);
app.get("/cikis", (req, res) => {
  req.logOut();
  return res.redirect("/");
});
app.get("/davet", (req, res) => {
  res.redirect(IDler.sunucuDavet);
});

/* SAYFALAR BURADAN İTİBAREN */
app.get("/", (req, res) => {
  res.render("index", {
    user: req.user
  });
});
app.get("/", (req, res) => {
  res.render("videolar", {
    user: req.user
  });
});

app.get("/normal", (req, res) => {
  var data = db.normal.get("kodlar");
  data = sortData(data);

  res.render("normal", {
    user: req.user,
    kodlar: data
  });
});
app.get("/normal/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.normal.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    res.render("kod", {
      user: req.user,
      kod: code
    });
  } else {
    res.redirect("/");
  }
});
app.get("/altin", (req, res) => {
  var data = db.altin.get("kodlar");
  data = sortData(data);
  res.render("altin", {
    user: req.user,
    kodlar: data
  });
});
app.get("/altin/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.altin.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.altınKodlarRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu arşivi görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/elmas", (req, res) => {
  var data = db.elmas.get("kodlar");
  data = sortData(data);
  res.render("elmas", {
    user: req.user,
    kodlar: data
  });
});
app.get("/elmas/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.elmas.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.elmasKodlarRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu Arşivi Görmek İçin Gerekli Rolün Yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});

app.get("/sistemler", (req, res) => {
  var data = db.sistemler.get("kodlar");
  data = sortData(data);
  res.render("sistemler", {
    user: req.user,
    kodlar: data
  });
});
app.get("/sistemler/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.sistemler.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.sistemlerrolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu arşivi görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/sistemler", (req, res) => {
  var data = db.sistemler.get("kodlar");
  data = sortData(data);
  res.render("sistemler", {
    user: req.user,
    kodlar: data
  });
});
app.get("/sistemler/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.sistemler.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.sistemlerrolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu arşivi görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/hazir", (req, res) => {
  var data = db.hazir.get("kodlar");
  data = sortData(data);
  res.render("hazir", {
    user: req.user,
    kodlar: data
  });
});
app.get("/hazir/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.hazir.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.hazırSistemlerRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu Arşivi Görmek İçin Gerekli Rolünüz Yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/topluluk", (req, res) => {
  var data = db.topluluk.get("kodlar");
  data = sortData(data);
  res.render("topluluk", {
    user: req.user,
    kodlar: data
  });
});
app.get("/topluluk/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Arşivleri Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.topluluk.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    res.render("kod", {
      user: req.user,
      kod: code
    });
  } else {
    res.redirect("/");
  }
});
app.get("/profil/:id", (req, res) => {
  let id = req.params.id;
  let member = client.guilds.cache.get(IDler.sunucuID).members.cache.get(id);
  if (!member)
    res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 501,
          message: "Belirtilen Profil Bulunamadı"
        }
      })
    );
  else {
    let perms = {
      altin:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.altınKodlarRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü),
      elmas:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.elmasKodlarRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü),
      hazir:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü) ||
        member.roles.cache.has(IDler.hazırAltyapılarRolü),
      destekçi: member.roles.cache.has(IDler.boosterRolü),
      yetkili:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü)
    };
    res.render("profil", {
      user: req.user,
      member: member,
      avatarURL: member.user.avatarURL(),
      perms: perms,
      stats: db.api.get(`${member.user.id}`)
    });
  }
});

app.get("/sil/:rank/:id", (req, res) => {
  if (req.user) {
    let member = client.guilds.cache
      .get(IDler.sunucuID)
      .members.cache.get(req.user.id);
    if (!member) {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 502,
            message: "Bu Sayfayı Görmek İçin Gerekli Yetkiye Sahip Değilsiniz"
          }
        })
      );
    } else {
      if (member.roles.cache.has(IDler.sahipRolü)) {
        let id = req.params.id;
        if (!id) {
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Bir Kod İd'si Belirtin"
              }
            })
          );
        }
        let rank = req.params.rank;
        if (!rank) {
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Bir kod rankı'si belirtin"
              }
            })
          );
        }

        var rawId = findCodeToId(db[rank].get("kodlar"), id);
        if (!rawId)
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Üzgünüm ancak böyle bir kod hiçbir zaman bulunmadı!"
              }
            })
          );
        else {
          if (req.user) db.api.add(`${req.user.id}.silinen`, 1);
          db[rank].delete("kodlar." + rawId.isim);
          res.redirect("/");
        }
      } else {
        res.redirect(
          url.format({
            pathname: "/hata",
            query: {
              statuscode: 502,
              message: "Bu sayfayı görmek için gerekli yetkiye sahip değilsiniz"
            }
          })
        );
      }
    }
  } else {
    res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 501,
          message: "Bu sayfayı görmek için giriş yapmalısınız"
        }
      })
    );
  }
});
//-----------------------------------------------sayfalar---------------------------------------------------------------
app.get("/bilgilendirme", (req, res) => {
  res.render("bilgilendirme", {
    user: req.user
  });
});

app.get("/botlist", (req, res) => {
  res.redirect("https://discord.gg/7V8SdeH");
});

app.get("/bilmiyom", (req, res) => {
  res.render("bilmiyom", {
    user: req.user
  });
});
app.get("/bakim", (req, res) => {
  res.render("bakim", {
    user: req.user
  });
});

app.get("/taxperia", (req, res) => {
  res.redirect("https://discord.gg/wRbgTkVVB2");
});

app.get("/discord", (req, res) => {
  res.redirect("https://discord.gg/x4uSgMs");
});

//--------------------------------------------------------------------------------

app.get("/paylas", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 138,
          message:
            "Arşiv paylaşabilmek için Discord sunucumuza katılmanız ve siteye giriş yapmanız gerekmektedir."
        }
      })
    );
  res.render("kod_paylas", {
    user: req.user
  });
});
app.post("/paylasim", (req, res) => {
  let guild = client.guilds.cache.get(IDler.sunucuID);
  let member = req.user ? guild.members.cache.get(req.user.id) : null;
  let rank = "topluluk";
  if (
    member &&
    IDler.kodPaylaşamayacakRoller.some(id => member.roles.cache.has(id))
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 502,
          message: "Kod Paylaşma İznin Yok!"
        }
      })
    );
  if (
    member &&
    (member.roles.cache.has(IDler.sahipRolü) ||
      member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
      member.roles.cache.has(IDler.adminRolü))
  )
    rank = req.body.kod_rank;

  let auht = [];
  if (req.user) auht.push(req.user);
  let auth_arr = req.body.author.split(",");

  auth_arr.forEach(auth => {
    let user = client.users.cache.get(auth);
    auht.push(req.user);
  });

  let obj = {
    author: req.auth,
    isim: req.body.kod_adi,
    id: randomString({ length: 10 }),
    desc: req.body.desc,
    modules: req.body.modules.split(","),
    icon: req.user
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : `https://cdn.discordapp.com/icons/${IDler.sunucuID}/a_830c2bcfa4f1529946e82f15441a1227.jpg`,
    main_code: req.body.main_code,
    komutlar_code: req.body.komutlar_code,
    kod_rank: rank,
    k_adi: req.user.username,
    date: new Date(Date.now()).toLocaleDateString()
  };
  if (req.user) db.api.add(`${req.user.id}.paylasilan`, 1);
  db[obj.kod_rank].set(`kodlar.${obj.isim}`, obj);
  client.channels.cache.get(IDler.kodLogKanalı).send(
    new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setFooter(
        client.guilds.cache.get(IDler.sunucuID).name,
        client.guilds.cache
          .get(IDler.sunucuID)
          .iconURL({ dynamic: true, size: 2048 })
      )
      .setTimestamp()
      .setAuthor("Bir Kod Paylaşıldı!", client.user.avatarURL)
      .addField(
        "Kod Bilgileri",
        `**Adı:** ${obj.isim} \n**Açıklaması:** ${obj.desc} \n**Değeri:** ${obj.kod_rank} \n**Paylaşan:** ${obj.k_adi}`
      )
      .addField(
        "Kod Sayfası",
        `[Tıkla!](https://rabelcode.glitch.me/${obj.kod_rank}/${obj.id})`
      )
  );
  res.redirect(`/${obj.kod_rank}/${obj.id}`);
});

function findCodeToId(data, id) {
  var keys = Object.keys(data);
  keys = keys.filter(key => data[key].id == id)[0];
  keys = data[keys];
  return keys;
}

function sortData(object) {
  var keys = Object.keys(object);
  var newData = {};
  var arr = [];
  keys.forEach(key => {
    // sup pothc :)
    arr.push(key);
  });
  arr.reverse();
  arr.forEach(key => {
    newData[key] = object[key];
  });
  return newData;
}

app.get("/hata", (req, res) => {
  res.render("hata", {
    user: req.user,
    statuscode: req.query.statuscode,
    message: req.query.message
  });
});

app.use((req, res) => {
  const err = new Error("Not Found");
  err.status = 404;
  return res.redirect(
    url.format({
      pathname: "/hata",
      query: {
        statuscode: 404,
        message: "Sayfa Bulunamadı"
      }
    })
  );
});

client.login(rabel.rabeltoken);

client.on("message", msg => {
  if (msg.content.toLowerCase() === "sa") {
    msg.reply("Aleykümselam");
  }
});

client.on("message", msg => {
  if (msg.content.toLowerCase() === "bot") {
    msg.reply("Burdayım");
    msg.channel.send("Ne oldu ne istiyorsun kardeşim?");
  }
});

//----------------------------------Özel oda sistemi Son----------------------------//
