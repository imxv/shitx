'use client';

import { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { partners } from '@/config/partners';
import '../hackathon.css';

interface OwnedNFT {
  partnerId: string;
  partnerName: string;
  nftName: string;
  tokenId?: string;
}

export default function ToiletPage() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>('default');
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackpack, setShowBackpack] = useState(false);
  
  // 获取用户拥有的 NFT
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      const identity = getUserIdentity();
      const evmAddress = generateEVMAddress(identity.fingerprint);
      
      try {
        // 检查主 NFT
        const mainNFTResponse = await fetch(`/api/v1/nft-status/${evmAddress}`);
        const mainNFTData = await mainNFTResponse.json();
        
        const owned: OwnedNFT[] = [];
        
        // 添加主 NFT（所有人都有）
        if (mainNFTData.hasClaimed) {
          owned.push({
            partnerId: 'default',
            partnerName: 'ShitX',
            nftName: 'Shit NFT',
            tokenId: mainNFTData.nft?.tokenId,
          });
        }
        
        // 检查合作方 NFT
        for (const partner of partners) {
          const partnerNFTResponse = await fetch(`/api/v1/partner-nft-status/${partner.id}/${evmAddress}`);
          const partnerNFTData = await partnerNFTResponse.json();
          
          if (partnerNFTData.hasClaimed) {
            owned.push({
              partnerId: partner.id,
              partnerName: partner.displayName,
              nftName: partner.nftName,
              tokenId: partnerNFTData.nft?.tokenId,
            });
          }
        }
        
        setOwnedNFTs(owned);
        setLoading(false);
        
        // 默认选择第一个拥有的 NFT
        if (owned.length > 0) {
          setSelectedPartner(owned[0].partnerId);
        }
      } catch (error) {
        console.error('Error fetching owned NFTs:', error);
        setLoading(false);
      }
    };
    
    fetchOwnedNFTs();
  }, []);
  
  // Generate QR code
  const generateQRCode = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000);
      const userIdentity = getUserIdentity();
      const selectedNFT = ownedNFTs.find(nft => nft.partnerId === selectedPartner);
      
      // 构建 URL 参数
      const baseUrl = `https://shitx.top?t=${timestamp}&id=${randomId}&user=${userIdentity.id}`;
      let url = baseUrl;
      
      // 添加 referral 参数
      if (selectedPartner !== 'default') {
        url += `&ref=${selectedPartner}`;
        // 添加推荐人的NFT ID
        if (selectedNFT?.tokenId) {
          url += `&nft=${selectedNFT.tokenId}`;
        }
      }
      
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
  }, [selectedPartner, ownedNFTs]);

  // Update QR code every 5 seconds
  useEffect(() => {
    if (!loading && ownedNFTs.length > 0) {
      generateQRCode();
      const interval = setInterval(() => {
        setCurrentIndex(prev => prev + 1);
        generateQRCode();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [generateQRCode, selectedPartner, loading, ownedNFTs]);

  const handleAddToAppleToilet = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };
  
  const handleSelectNFT = (partnerId: string) => {
    setSelectedPartner(partnerId);
    setShowBackpack(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen cyber-gradient p-4 flex items-center justify-center">
        <div className="text-green-400 text-2xl animate-pulse">检查厕所使用权...</div>
      </main>
    );
  }

  if (ownedNFTs.length === 0) {
    return (
      <main className="min-h-screen cyber-gradient p-4 relative overflow-hidden">
        <div className="scan-line absolute inset-0 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={() => router.push('/')}
            className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
          >
            ← 返回首页
          </button>
          
          <div className="bg-gray-900 border border-red-500 rounded-2xl p-8 shadow-2xl shadow-red-500/20 text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">无权使用厕所</h1>
            <p className="text-gray-400 mb-6">你还没有任何 Shit NFT，请先去首页领取</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              去领取 NFT
            </button>
          </div>
        </div>
      </main>
    );
  }

  const selectedNFT = ownedNFTs.find(nft => nft.partnerId === selectedPartner);

  return (
    <main className="h-screen cyber-gradient relative overflow-hidden flex flex-col">
      <div className="scan-line absolute inset-0 pointer-events-none"></div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 p-4">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
        >
          ← 返回首页
        </button>
      </div>
      
      {/* 主内容区域 - 自适应剩余高度 */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4 relative z-10">
        <div className="max-w-4xl w-full">

          {/* United Toilet 主界面 */}
          <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-6 shadow-2xl shadow-yellow-500/20">
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4 text-center neon-glow">
            United Toilet
          </h1>
          
            {/* 当前选中的 NFT 显示和背包按钮 */}
            <div className="mb-4 text-center">
              {selectedNFT && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400">当前分享:</p>
                  <p className="text-yellow-400 font-medium">{selectedNFT.nftName}</p>
                </div>
              )}
              <button
                onClick={() => setShowBackpack(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all border border-gray-700"
              >
                <span className="text-xl">🎒</span>
                <span>NFT 背包</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-1">
                  {ownedNFTs.length}
                </span>
              </button>
            </div>
          
            <div className="text-center">
              <p className="text-green-400 mb-2">扫描二维码进入 ShitX.top</p>
              <p className="text-sm text-gray-400 mb-4">二维码每5秒自动刷新</p>
            
              {/* QR Code Display */}
              <div className="inline-block p-3 bg-black rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/20">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code to shitx.top" 
                    className="w-48 h-48 md:w-64 md:h-64"
                  />
                ) : (
                  <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center text-green-400">
                    生成中...
                  </div>
                )}
              </div>
            
           
            
              {/* 添加到 Apple Toilet 按钮 */}
              <button
                onClick={handleAddToAppleToilet}
                className="mt-4 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2 mx-auto border border-gray-700"
              >
                <span className="text-xl">🍎</span>
                <span className="font-medium">添加到 Apple Toilet</span>
              </button>
            </div>

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

      {/* 背包菜单 - 上滑动画 */}
      {showBackpack && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowBackpack(false)}
          />
          
          {/* 背包面板 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-yellow-500 rounded-t-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-yellow-400">🎒 NFT 背包</h3>
                <button
                  onClick={() => setShowBackpack(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {ownedNFTs.map((nft) => (
                  <button
                    key={nft.partnerId}
                    onClick={() => handleSelectNFT(nft.partnerId)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPartner === nft.partnerId
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-4xl mb-2">💩</div>
                    <div className="text-sm font-medium text-white">{nft.nftName}</div>
                    <div className="text-xs text-gray-400 mt-1">{nft.partnerName}</div>
                    {nft.tokenId && (
                      <div className="text-xs text-gray-500 mt-1">#{nft.tokenId}</div>
                    )}
                    {selectedPartner === nft.partnerId && (
                      <div className="text-xs text-yellow-400 mt-2">当前选中</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
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
        
        @keyframes slide-up {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}