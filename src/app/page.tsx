'use client';

import Link from 'next/link';
import { NFTClaimModal } from '@/components/NFTClaimModal';
import { GrantStatusCard } from '@/components/GrantStatusCard';
import { NFTCollectionCard } from '@/components/NFTCollectionCard';
import { TopBar } from '@/components/TopBar';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import './hackathon.css';

function HomeContent() {
  const searchParams = useSearchParams();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimScenario, setClaimScenario] = useState<'new_user' | 'old_user_scan' | 'new_user_scan'>('new_user');
  const [partnerNFTData, setPartnerNFTData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 用于刷新子组件
  
  useEffect(() => {
    // 获取 URL 中的参数
    const ref = searchParams.get('ref');
    const referrerUserId = searchParams.get('user');
    const referrerNFTId = searchParams.get('nft');
    const sig = searchParams.get('sig');
    const timestamp = searchParams.get('t');
    const id = searchParams.get('id');
    
    // 如果有签名，说明是通过QR code扫描进入的
    if (sig && timestamp && id && referrerUserId) {
      // 保存QR code参数，用于后续验证
      const qrParams = {
        t: timestamp,
        id: id,
        user: referrerUserId,
        ...(ref && { ref }),
        ...(referrerNFTId && { nft: referrerNFTId }),
        sig
      };
      sessionStorage.setItem('qrParams', JSON.stringify(qrParams));
      sessionStorage.setItem('isQRScan', 'true');
    }
    
    if (ref) {
      // 记录 referral 来源（合作方）
      getUserIdentity(ref);
    } else {
      // 没有 ref 参数也要调用，确保生成用户身份
      getUserIdentity();
    }
    
    // 保存分享者信息
    if (referrerUserId) {
      sessionStorage.setItem('referrerUserId', referrerUserId);
    }
    
    // 保存推荐人NFT ID（用于合作方NFT）
    if (referrerNFTId) {
      sessionStorage.setItem('referrerNFTId', referrerNFTId);
    }
  }, [searchParams]);

  // 检查并处理NFT获取
  useEffect(() => {
    const checkAndClaimNFT = async () => {
      const identity = getUserIdentity();
      const evmAddress = generateEVMAddress(identity.fingerprint);
      
      // 检查是否已有主NFT
      const response = await fetch(`/api/v1/nft-status/${evmAddress}`);
      const mainNFTStatus = await response.json();
      const hasMainNFT = mainNFTStatus.hasClaimed;
      
      // 检查是否是扫码进入
      const isQRScan = sessionStorage.getItem('isQRScan') === 'true';
      const qrParamsStr = sessionStorage.getItem('qrParams');
      
      if (isQRScan && qrParamsStr) {
        // 扫码场景
        try {
          const qrParams = JSON.parse(qrParamsStr);
          
          // 验证QR code
          const qrResponse = await fetch('/api/v1/qr-claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrParams,
              claimerUserId: identity.id,
              claimerUsername: identity.username,
              claimerFingerprint: identity.fingerprint,
              claimerAddress: evmAddress
            })
          });
          
          const qrData = await qrResponse.json();
          
          if (qrData.success && qrData.canClaim) {
            // 设置合作方NFT数据
            setPartnerNFTData({
              partnerId: qrData.partnerId,
              partnerName: qrData.partnerName,
              nftName: qrData.nftName
            });
            
            // 判断场景
            if (!hasMainNFT) {
              setClaimScenario('new_user_scan');
            } else {
              setClaimScenario('old_user_scan');
            }
            
            setShowClaimModal(true);
          }
          
          // 清理sessionStorage
          sessionStorage.removeItem('isQRScan');
          sessionStorage.removeItem('qrParams');
        } catch (error) {
          console.error('Error processing QR scan:', error);
        }
      } else if (!hasMainNFT) {
        // 新用户直接访问
        setClaimScenario('new_user');
        setShowClaimModal(true);
      }
    };
    
    // 延迟执行，确保页面加载完成
    setTimeout(checkAndClaimNFT, 1000);
  }, []);

  return (
    <main className="min-h-screen cyber-gradient flex items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 relative overflow-hidden">
      <TopBar />
      
      {/* NFT 获取模态框 */}
      <NFTClaimModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          // 刷新状态卡片
          setRefreshKey(prev => prev + 1);
        }}
        scenario={claimScenario}
        partnerNFT={partnerNFTData}
      />
      
      {/* 科技感背景元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
      </div>
      
      
      
     <div className="relative max-w-5xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-10 space-y-4 sm:space-y-6">
          <div className="relative inline-block">
            <img 
              src="/shitx.png" 
              alt="ShitX Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 animate-float"
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold terminal-cursor mb-2 sm:mb-3">
              <span className="text-yellow-400 neon-glow">Shit</span>
              <span className="text-green-400 neon-glow">X</span>
            </h1>

          </div>

        </div>




        {/* 主要功能按钮 - United Toilet */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/toilet"
            className="group relative block max-w-sm sm:max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse"></div>
            <button className="relative w-full px-6 sm:px-12 py-6 sm:py-8 bg-gray-900/90 text-yellow-400 text-xl sm:text-2xl font-bold rounded-2xl hover:bg-gray-800/90 transition-all shadow-2xl border-2 border-yellow-500/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <span className="text-4xl sm:text-6xl">✨</span>
                <span className="text-xl sm:text-3xl">United Card</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
            </button>
          </Link>
        </div>
        {/* 状态卡片组 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6 sm:mb-8">
          <GrantStatusCard key={`grant-${refreshKey}`} />
          <NFTCollectionCard key={`collection-${refreshKey}`} />
        </div>



      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center px-4">
        <p className="text-gray-500 text-xs tracking-wider">© 2024 ShitX - 全场最尊重所构建之物的团队</p>
        <p className="text-gray-600 text-xs mt-1 opacity-70">不需要创造失眠，我们建议你多睡</p>
      </div>

      {/* 科技感装饰线 */}
      <div className="absolute top-8 sm:top-10 left-4 sm:left-10 right-4 sm:right-10 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
      <div className="absolute bottom-8 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-10 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-green-400 text-2xl animate-pulse">Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}