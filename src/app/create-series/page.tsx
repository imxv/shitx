'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';

export default function CreateSeriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState(true);
  const CREATION_COST = 10000;
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    nftName: '',
    description: '',
    longDescription: '',
    website: '',
    totalSupply: '100',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // 获取用户余额
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const identity = getUserIdentity();
        const evmAddress = generateEVMAddress(identity.fingerprint);
        
        // 使用与首页完全相同的API端点
        const response = await fetch(`/api/v1/grant/${evmAddress}`);
        const data = await response.json();
        
        // 使用与首页相同的余额字段
        setUserBalance(data.balance || '0');
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 自动生成相关字段
    if (name === 'displayName' && !formData.name) {
      // 生成英文ID（移除空格，转小写）
      const englishName = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      setFormData(prev => ({
        ...prev,
        name: englishName
      }));
    }

    if (name === 'displayName' && !formData.nftName) {
      // 自动生成NFT名称
      setFormData(prev => ({
        ...prev,
        nftName: `ShitX ${value}`
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const identity = getUserIdentity();
      const evmAddress = generateEVMAddress(identity.fingerprint);

      const formDataToSend = new FormData();
      
      // 添加基本信息
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // 添加创建者信息
      formDataToSend.append('creatorId', identity.id);
      formDataToSend.append('creatorAddress', evmAddress);
      formDataToSend.append('creatorName', identity.username);
      
      // 添加Logo文件
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await fetch('/api/v1/series/create', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || `恭喜！您已成功创建 "${formData.displayName}" 系列，并获得了始祖卡片！`);
        router.push('/my-toilet');
      } else {
        alert('创建失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error creating series:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">🎨 创建您的ShitX极速卡片</h1>
          <p className="text-gray-300">ShitX极速卡片是集概括、分发、增长于一体的极速卡片系统</p>
        </div>

        {/* 余额和费用信息 */}
        <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 font-semibold">💰 创建费用</p>
              <p className="text-2xl font-bold text-white">{CREATION_COST.toLocaleString()} SHIT</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">您的余额</p>
              {balanceLoading ? (
                <p className="text-xl text-gray-300">加载中...</p>
              ) : (
                <p className={`text-xl font-bold ${parseInt(userBalance) >= CREATION_COST ? 'text-green-400' : 'text-red-400'}`}>
                  {parseInt(userBalance).toLocaleString()} SHIT
                </p>
              )}
            </div>
          </div>
          {!balanceLoading && parseInt(userBalance) < CREATION_COST && (
            <div className="mt-2 space-y-1">
              <p className="text-red-400 text-sm">⚠️ 余额不足，无法创建系列</p>
              <p className="text-gray-300 text-xs">
                💡 提示：在首页通过ShitX Grant系统领取补贴和获得推荐奖励来赚取SHIT
              </p>
              {/* 临时调试信息 */}
              <details className="text-xs text-gray-400 mt-2">
                <summary className="cursor-pointer hover:text-gray-300">查看余额调试信息</summary>
                <div className="mt-1 p-2 bg-gray-900/50 rounded">
                  <p>当前余额: {userBalance} SHIT</p>
                  <p>需要费用: {CREATION_COST} SHIT</p>
                  <p className="mt-1">如果余额显示有误，请返回首页查看ShitX Grant状态</p>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* 创建表单 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 text-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo上传 */}
            <div>
              <label className="block text-sm font-medium mb-2">系列Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo预览" 
                    className="w-20 h-20 rounded-lg object-cover border-2 border-purple-500"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">建议使用正方形图片，支持 JPG、PNG、GIF</p>
            </div>

            {/* 系列名称 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                系列名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                placeholder="例如：神秘星辰"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* 英文ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                英文ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                pattern="[a-z0-9]+"
                placeholder="例如：mysticalstars"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">只能包含小写字母和数字，用于URL和系统标识</p>
            </div>

            {/* ShitX卡片名称模板 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ShitX卡片名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="nftName"
                value={formData.nftName}
                onChange={handleInputChange}
                required
                placeholder="例如：ShitX 神秘星辰"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">每个ShitX极速卡片的名称格式</p>
            </div>

            {/* 简短描述 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                简短描述 <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={2}
                placeholder="一句话介绍您的ShitX极速卡片"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* 详细介绍 */}
            <div>
              <label className="block text-sm font-medium mb-2">详细介绍</label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows={4}
                placeholder="详细描述您的ShitX极速卡片系列的故事、特色和价值..."
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* 网站链接 */}
            <div>
              <label className="block text-sm font-medium mb-2">相关网站</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              <div className="mt-2 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 还没有网站？可以去 
                  <a 
                    href="https://www.youware.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Youware
                  </a> 
                  快速创建一个专属网站，让您的ShitX卡片更好地概括和展示项目价值
                </p>
              </div>
            </div>

            {/* 总供应量 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                总供应量 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply}
                onChange={handleInputChange}
                required
                min="10"
                max="10000"
                placeholder="100"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">建议在10-10000之间，您将自动获得第1张始祖卡片，拥有该系列的分发权</p>
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || balanceLoading || parseInt(userBalance) < CREATION_COST}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    创建中...
                  </span>
                ) : (
                  '创建极速卡片系列'
                )}
              </button>
            </div>

            {/* 提示信息 */}
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">🚀 ShitX极速卡片特权</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 获得始祖卡片，成为该系列的创造者和管理者</li>
                <li>• 极速概括：一个卡片浓缩您的项目价值和故事</li>
                <li>• 极速分发：通过二维码和链接快速传播</li>
                <li>• 极速增长：查看分发数据，追踪增长轨迹</li>
                <li>• 社区裂变：每个持有者都能成为您的推广节点</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}