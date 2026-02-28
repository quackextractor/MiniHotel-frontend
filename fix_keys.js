const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const localesData = {};
for (const file of files) {
    localesData[file] = JSON.parse(fs.readFileSync(path.join(messagesDir, file), 'utf8'));
}

const en = localesData['en.json'];
en.Bookings.status['checked-in'] = en.Bookings.status['checked_in'] || "Checked In";
en.Bookings.status['checked-out'] = en.Bookings.status['checked_out'] || "Checked Out";
en.Bookings.status['pending payment'] = en.Bookings.status['pending_payment'] || "Pending Payment";
en.Bookings.status['pending-payment'] = en.Bookings.status['pending_payment'] || "Pending Payment";
if (!en.Bookings.paymentStatus) en.Bookings.paymentStatus = {};
en.Bookings.paymentStatus['not-paid'] = en.Bookings.paymentStatus['not_paid'] || "Not Paid";

function fillMissing(target, source) {
    for (const key in source) {
        if (key === '_meta') continue;
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            fillMissing(target[key], source[key]);
        } else {
            if (target[key] === undefined) {
                target[key] = source[key];
            }
        }
    }
}

for (const file of files) {
    if (file === 'en.json') continue;
    fillMissing(localesData[file], en);
}

for (const file of files) {
    fs.writeFileSync(path.join(messagesDir, file), JSON.stringify(localesData[file], null, 4));
}
console.log("Keys synced!");
