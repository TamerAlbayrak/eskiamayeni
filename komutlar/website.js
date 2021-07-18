const Discord = require('discord.js');
const db = require('quick.db');

exports.run = async (client, message, args) => {

    let kontrol = await db.fetch(`dil_${message.guild.id}`);
    let prefix = (await db.fetch(`prefix_${message.guild.id}`)) || "!";
    if (kontrol == "TR_tr") {

const tax = new Discord.MessageEmbed();
tax.setDescription("Taxperia Botumuzun Sitesine gitmek İçin Bu Bağlantıya Tıkla [TIKLA](https://www.taxperia.tk)")

message.channel.send(tax)
    } else {
        const tax = new Discord.MessageEmbed();
tax.setDescription("Click This Link To Go To Our Taxperia Bot\'s Site [Click](https://www.taxperia.tk)")

message.channel.send(tax)

    }
}
exports.conf = {
enabled: true,
guildOnly: false,
aliases: ['site'],
permLevel: 0
}

exports.help = {
name: 'website',

} 