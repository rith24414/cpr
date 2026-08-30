# CPR

វេបសាយ CPR — ផុសរូបភាព, ថតរូបផ្ទាល់, ជជែកអក្សរ និងជជែកសំឡេង ដោយភ្ជាប់ជាមួយ **អ្នកប្រើពិតៗ** ចៃដន្យ (ដូច Omegle) តាមរយៈ Socket.IO + WebRTC។

## តម្រូវការ

- ដំឡើង [Node.js](https://nodejs.org) កំណែ 18 ឡើងទៅ

## របៀបដំណើរការនៅលើម៉ាស៊ីនអ្នក (localhost)

```
npm install
npm start
```

បន្ទាប់មកបើក `http://localhost:3000`

**សំខាន់៖** ដើម្បីសាកល្បងការជជែក/ភ្ជាប់មនុស្សពិត អ្នកត្រូវបើក **2 browser tabs ឬ 2 ឧបករណ៍** ព្រមគ្នា ព្រោះវាត្រូវការមនុស្ស 2 នាក់ដើម្បីផ្គូផ្គង។

## ការដាក់ដំណើរការជាសាធារណៈ (Deploy)

កូដនេះជា Node.js server ពិត (មិនមែនគេហទំព័រ static ទេ) ដូច្នេះត្រូវការ hosting ដែលគាំទ្រ Node.js ជានិច្ច (មិនមែន GitHub Pages ឬ static hosting ទេ)។ ជម្រើសល្អៗ៖

- [Render.com](https://render.com) (មាន free tier)
- [Railway.app](https://railway.app)
- Vultr / DigitalOcean VPS (ត្រូវការចេះ config ខ្លះ)

ជំហានទូទៅ៖
1. Upload កូដនេះទៅ GitHub repository
2. ភ្ជាប់ repository ទៅ Render/Railway
3. កំណត់ Build command: `npm install`, Start command: `npm start`
4. Deploy — គេហទំព័រនឹងទទួលបាន URL សាធារណៈ

## កំណត់សម្គាល់សំខាន់ៗអំពី WebRTC (សំឡេង)

- កូដនេះប្រើ Google's public STUN server (`stun.l.google.com`) ដែលគ្រប់គ្រាន់សម្រាប់អ្នកប្រើភាគច្រើន
- ប៉ុន្តែអ្នកប្រើខ្លះនៅក្រោយ Firewall/NAT តឹងរឹង (ជាពិសេសក្នុងបណ្តាញក្រុមហ៊ុន ឬទូរស័ព្ទចល័តមួយចំនួន) នឹង **មិនអាចភ្ជាប់សំឡេងគ្នាបានទេ** ដោយគ្មាន **TURN server**
- បើអ្នកចង់ឲ្យសំឡេងដំណើរការគ្រប់ករណី សូមបន្ថែម TURN server ដូចជា [Twilio Network Traversal](https://www.twilio.com/docs/stun-turn) ឬដំឡើង [coturn](https://github.com/coturn/coturn) ដោយខ្លួនឯង ហើយបន្ថែមទៅក្នុង `ICE_SERVERS` នៅឯ `public/script.js`

## ចំណុចសុវត្ថិភាព/កំណត់ដែលអ្នកគួរដឹង

- **គ្មានប្រព័ន្ធ Login** — Post គេហទំព័រនេះជាសាធារណៈ អ្នកគ្រប់គ្នាអាចលុបរូបភាពនរណាម្នាក់បាន។ បើដាក់ដំណើរការជាសាធារណៈ គួរបន្ថែម user authentication
- រូបភាពនីមួយៗកំណត់ត្រឹម 15MB ចំនួន Post មិនកំណត់ (កំណត់ត្រឹមទំហំថាសរបស់ server)
- ការជជែក/សំឡេងគ្មានការត្រួតពិនិត្យខ្លឹមសារ (moderation) — សម្រាប់គេហទំព័រសាធារណៈ គួរបន្ថែមប្រព័ន្ធ report/block
