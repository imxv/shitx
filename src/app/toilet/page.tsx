'use client';

import { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import '../hackathon.css';

export default function ToiletPage() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  
  // Generate different URLs with timestamp
  const generateUrl = () => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000);
    return `https://shitx.top?t=${timestamp}&id=${randomId}`;
  };

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    try {
      const url = generateUrl();
      const qrUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#00FF00',
          light: '#000000'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  }, []);

  // Update QR code every 5 seconds
  useEffect(() => {
    generateQRCode();
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
      generateQRCode();
    }, 5000);

    return () => clearInterval(interval);
  }, [generateQRCode]);

  const handleAddToAppleToilet = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <main className="min-h-screen cyber-gradient p-4 relative overflow-hidden">
      <div className="scan-line absolute inset-0"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
        >
          ← 返回首页
        </button>

        {/* United Toilet 主界面 */}
        <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-8 shadow-2xl shadow-yellow-500/20">
          <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center neon-glow">
            United Toilet
          </h1>
          
          <div className="text-center">
            <p className="text-green-400 mb-4">扫描二维码进入 ShitX.top</p>
            <p className="text-sm text-gray-400 mb-8">二维码每5秒自动刷新</p>
            
            {/* QR Code Display */}
            <div className="inline-block p-4 bg-black rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/20">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code to shitx.top" 
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-green-400">
                  生成中...
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              序号: #{currentIndex + 1}
            </div>
            
            {/* 添加到 Apple Toilet 按钮 */}
            <button
              onClick={handleAddToAppleToilet}
              className="mt-6 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2 mx-auto border border-gray-700"
            >
              <span className="text-xl">🍎</span>
              <span className="font-medium">添加到 Apple Toilet</span>
            </button>
          </div>

          {/* 装饰性文字 */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-yellow-400 terminal-cursor">United we sit, divided we shit</p>
            <p className="text-sm text-gray-500">全球厕所联盟 - 连接每一个有故事的马桶</p>
          </div>
        </div>
      </div>

      {/* 弹窗提示 */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gray-900 border border-red-500 rounded-2xl p-6 shadow-2xl shadow-red-500/50 animate-bounce-in pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🚽</span>
              <div>
                <h3 className="text-xl font-bold text-red-400">添加失败</h3>
                <p className="text-gray-400">Toilet 还没有清理干净，请稍后再试</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}