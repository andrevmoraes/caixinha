import sharp from 'sharp';
import fs from 'fs';

async function generateIcon(size, isMaskable = false) {
  const filename = isMaskable 
    ? `public/pwa-maskable-${size}x${size}.png`
    : `public/pwa-${size}x${size}.png`;
  
  const padding = size * 0.1;
  const coinRadius = (size - padding * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Criar SVG baseado no estilo da moeda Real
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coinGradient" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="40%" style="stop-color:#FFC700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DAA520;stop-opacity:1" />
        </radialGradient>
        
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.4"/>
        </filter>
      </defs>
      
      <!-- Fundo (para não-maskable) -->
      <rect width="${size}" height="${size}" fill="#ffffff" />
      
      <!-- Borda externa (marrom-escuro) -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius}" fill="#8B4513" filter="url(#shadow)"/>
      
      <!-- Círculo amarelo claro (efeito de borda) -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius * 0.95}" fill="#FFD700"/>
      
      <!-- Padrão de "lados da moeda" -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius * 0.95}" fill="url(#coinGradient)" opacity="0.8"/>
      
      <!-- Círculo principal (laranja) -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius * 0.85}" fill="#FF8C00"/>
      
      <!-- Centro gradiente -->
      <circle cx="${centerX}" cy="${centerY}" r="${coinRadius * 0.80}" fill="#FFA500" opacity="0.9"/>
      
      <!-- Texto "R$" -->
      <text 
        x="${centerX}" 
        y="${centerY + size * 0.08}" 
        font-size="${size * 0.35}" 
        font-weight="900" 
        text-anchor="middle" 
        fill="#FFFACD"
        font-family="Arial, sans-serif"
        text-shadow="2px 2px 4px rgba(0,0,0,0.3)"
      >
        R$
      </text>
    </svg>
  `;

  try {
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Gerado: ${filename}`);
  } catch (error) {
    console.error(`✗ Erro ao gerar ${filename}:`, error.message);
  }
}

async function main() {
  console.log('Gerando ícones PWA (estilo moeda Real)...\n');
  
  // Criar diretório public se não existir
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  // Gerar ícones em diferentes tamanhos
  await generateIcon(192, false);
  await generateIcon(192, true);
  await generateIcon(512, false);
  await generateIcon(512, true);

  console.log('\n✓ Todos os ícones foram gerados com sucesso!');
}

main().catch(console.error);
