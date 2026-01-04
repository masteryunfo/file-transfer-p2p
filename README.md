# 📱 Quick Transfer - P2P File Transfer

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmasteryunfo%2Ffile-transfer-p2p&project-name=file-transfer-p2p&repository-name=file-transfer-p2p&stores=%5B%7B%22type%22%3A%22kv%22%7D%5D)

Transfer files directly between devices via WiFi using WebRTC P2P technology.

## ✨ Features

- ✅ **Direct P2P Transfer** - Files never touch the cloud
- ✅ **Unlimited File Size** - No file size restrictions
- ✅ **100% Free** - Runs on Vercel free tier forever
- ✅ **Private & Secure** - End-to-end direct transfer
- ✅ **Easy to Use** - Simple 6-digit pairing code
- ✅ **No Login Required** - Instant transfer without accounts

## 🚀 One-Click Deploy

Click the button above to deploy your own instance to Vercel. It will:

1. Clone this repository to your GitHub account
2. Create a new Vercel project
3. Set up a Vercel KV database automatically
4. Deploy the application

**That's it!** Your file transfer app will be live in ~2 minutes.

## 📖 How to Use

### On Computer (Receiver):
1. Open your deployed app
2. Click **"Receive on Computer"**
3. A 6-digit code will appear (e.g., `A3B9F2`)
4. Keep the page open and wait

### On Phone (Sender):
1. Open the same app URL on your phone
2. Click **"Send from Phone"**
3. Enter the 6-digit code from your computer
4. Select a file
5. Click Send

## 🔧 Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **WebRTC** - Peer-to-peer connection
- **Vercel KV** - Redis for signaling
- **Lucide React** - Icons

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/masteryunfo/file-transfer-p2p.git
cd file-transfer-p2p

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Vercel KV credentials to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 How It Works

1. **Computer** creates a room and generates a 6-digit code
2. Computer creates a WebRTC offer and stores it in Vercel KV
3. **Phone** enters the code and retrieves the offer
4. Phone creates an answer and stores it back
5. Direct P2P connection is established via WebRTC
6. File transfers directly between devices (no server involved)

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🙏 Credits

Built with ❤️ using Next.js and WebRTC

---

**Star this repo if you find it useful!** ⭐
