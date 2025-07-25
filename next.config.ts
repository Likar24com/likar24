/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...інші налаштування
  images: {
    domains: [
      "raeqdsmsxdemfyetvprv.supabase.co" // твій домен, може бути інший!
      // якщо ти розгорнеш на проді — додай і продакшн-домен!
    ],
  },
};

module.exports = nextConfig;
