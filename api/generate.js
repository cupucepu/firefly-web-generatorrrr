export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

    const { text, ratio, type } = req.body;
    const apiKey = process.env.FIREFLY_API_KEY; 
    const token = process.env.FIREFLY_ACCESS_TOKEN;

    // --- LOGIKA UKURAN (BIAR TIDAK TOLOL) ---
    // Adobe Firefly butuh angka pixel pasti, bukan cuma "16:9"
    let width = 1024;
    let height = 1024;

    if (ratio === 'landscape') { width = 1792; height = 1024; }
    else if (ratio === 'portrait') { width = 1024; height = 1792; }
    else if (ratio === 'widescreen') { width = 2048; height = 858; }

    try {
        const response = await fetch("https://firefly-api.adobe.io/v2/images/generate", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({
                numVariations: 1,
                prompt: text,
                size: { width: width, height: height }, // Ukuran masuk di sini
                contentClass: type || "photo"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.message || "Token Adobe Expired/Salah" });
        }

        let imageUrl = "";
        if (data.images && data.images[0]) imageUrl = data.images[0].url;
        else if (data.outputs && data.outputs[0]) imageUrl = data.outputs[0].image.url;

        if (imageUrl) return res.status(200).json({ url: imageUrl });
        else return res.status(500).json({ error: "Gambar tidak ketemu" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
