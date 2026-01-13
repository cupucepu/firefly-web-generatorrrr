export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: "Method Not Allowed"});

    // Ambil token dari frontend (userToken)
    const { text, ratio, type, userToken } = req.body;
    
    // Client ID biasanya tetap, tapi kalau mau aman pake 'clio-playground-web'
    const apiKey = "clio-playground-web"; 
    
    // Pakai token dari inputan user. Kalau kosong, baru coba cari di env (opsional)
    const activeToken = userToken || process.env.FIREFLY_ACCESS_TOKEN;

    if (!activeToken) {
        return res.status(400).json({ error: "Token kosong! Isi di menu samping." });
    }

    // LOGIKA UKURAN
    let width = 1024;
    let height = 1024;
    if (ratio === 'landscape') { width = 1792; height = 1024; }
    else if (ratio === 'portrait') { width = 1024; height = 1792; }

    try {
        const response = await fetch("https://firefly-api.adobe.io/v2/images/generate", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Authorization": `Bearer ${activeToken}`, // Pakai token inputanmu
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://firefly.adobe.com/"
            },
            body: JSON.stringify({
                numVariations: 1,
                prompt: text,
                size: { width: width, height: height },
                contentClass: type || "photo"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: "Token Ditolak Adobe (Mungkin Expired). Cek Inspect Element lagi." });
        }

        let imageUrl = "";
        if (data.images && data.images[0]) imageUrl = data.images[0].url;
        else if (data.outputs && data.outputs[0]) imageUrl = data.outputs[0].image.url;

        if (imageUrl) return res.status(200).json({ url: imageUrl });
        else return res.status(500).json({ error: "Gambar tidak ditemukan" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
