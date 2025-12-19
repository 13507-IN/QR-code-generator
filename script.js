// Basic customizable QR generator using qr-code-styling
const wrap = document.getElementById('qr-wrap');

const defaultSize = 300;
const qrCode = new QRCodeStyling({
  width: defaultSize,
  height: defaultSize,
  data: document.getElementById('text').value,
  image: undefined,
  dotsOptions: { color: '#000000', type: 'rounded' },
  backgroundOptions: { color: '#ffffff' },
  imageOptions: { crossOrigin: 'anonymous', margin: 5 },
  qrOptions: { errorCorrectionLevel: 'M' },
  margin: 10
});

qrCode.append(wrap);

function applyOptions(){
  const text = document.getElementById('text').value;
  const size = Number(document.getElementById('size').value);
  const dotsColor = document.getElementById('dotsColor').value;
  const bgColor = document.getElementById('bgColor').value;
  const dotStyle = document.getElementById('dotStyle').value;
  const ec = document.getElementById('ecLevel').value;
  const compat = document.getElementById('compat').checked;

  document.getElementById('sizeVal').textContent = size;

  // If compatibility mode is enabled, prefer square modules, higher EC and larger margin
  const useDotType = compat ? 'square' : dotStyle;
  const useEC = compat ? 'H' : ec;
  const useMargin = compat ? 20 : 10;

  qrCode.update({
    data: text,
    width: size,
    height: size,
    dotsOptions: { color: dotsColor, type: useDotType },
    backgroundOptions: { color: bgColor },
    qrOptions: { errorCorrectionLevel: useEC },
    margin: useMargin
  });
}

// Wire up controls
document.getElementById('apply').addEventListener('click', applyOptions);
document.getElementById('size').addEventListener('input', applyOptions);
document.getElementById('dotsColor').addEventListener('input', applyOptions);
document.getElementById('bgColor').addEventListener('input', applyOptions);
document.getElementById('dotStyle').addEventListener('change', applyOptions);
document.getElementById('ecLevel').addEventListener('change', applyOptions);

// Logo upload
document.getElementById('logo').addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    // Resize logo to be at most 20% of QR size to avoid covering too much
    const img = new Image();
    img.onload = () => {
      const size = Number(document.getElementById('size').value) || defaultSize;
      const maxLogoDim = Math.round(size * 0.2);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, maxLogoDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const resized = canvas.toDataURL('image/png');
      qrCode.update({ image: resized, imageOptions: { crossOrigin: 'anonymous', margin: 5 } });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
});

// Downloads
document.getElementById('download-png').addEventListener('click', ()=>{
  qrCode.download({ extension: 'png' });
});
document.getElementById('download-svg').addEventListener('click', ()=>{
  qrCode.download({ extension: 'svg' });
});
// High-res PNG: create a temporary larger QR instance and trigger download
document.getElementById('download-png-hr').addEventListener('click', async ()=>{
  const scale = 3; // 3x size for high-res
  const size = Number(document.getElementById('size').value) || defaultSize;
  const text = document.getElementById('text').value;
  const dotsColor = document.getElementById('dotsColor').value;
  const bgColor = document.getElementById('bgColor').value;
  const compat = document.getElementById('compat').checked;
  const dotStyle = compat ? 'square' : document.getElementById('dotStyle').value;
  const ec = compat ? 'H' : document.getElementById('ecLevel').value;

  // If there's a logo currently set on the visible qrCode, try to use it but resized
  // We can't access internal image directly, so reuse the file input if present
  const fileInput = document.getElementById('logo');
  let logoData = undefined;
  if(fileInput.files && fileInput.files[0]){
    // create resized logo to match the larger size (20% of large QR)
    const file = fileInput.files[0];
    logoData = await new Promise((res)=>{
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxLogoDim = Math.round(size * scale * 0.2);
          const canvas = document.createElement('canvas');
          const ratio = Math.min(1, maxLogoDim / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          res(canvas.toDataURL('image/png'));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  const tmp = new QRCodeStyling({
    width: size * scale,
    height: size * scale,
    data: text,
    image: logoData,
    dotsOptions: { color: dotsColor, type: dotStyle },
    backgroundOptions: { color: bgColor },
    imageOptions: { crossOrigin: 'anonymous', margin: 5 },
    qrOptions: { errorCorrectionLevel: ec },
    margin: compat ? 20 : 10
  });
  // append off-document then download
  const div = document.createElement('div');
  div.style.position = 'fixed'; div.style.left = '-9999px'; document.body.appendChild(div);
  await tmp.append(div);
  tmp.download({ extension: 'png' });
  setTimeout(()=>{ try{ document.body.removeChild(div); }catch(e){} }, 1200);
});

// Initial apply to render default
applyOptions();
