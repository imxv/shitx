'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { usePartners } from '@/hooks/usePartners';

export default function EditSeriesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { partners } = usePartners();
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<any>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    longDescription: '',
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    if (partners) {
      const foundSeries = partners.find(p => p.id === params.id);
      if (foundSeries) {
        // 验证是否是创建者
        const identity = getUserIdentity();
        const evmAddress = generateEVMAddress(identity.fingerprint);
        
        if (foundSeries.creatorAddress?.toLowerCase() !== evmAddress.toLowerCase()) {
          alert('您没有权限编辑此系列');
          router.push('/my-toilet');
          return;
        }
        
        setSeries(foundSeries);
        setFormData({
          displayName: foundSeries.displayName || '',
          description: foundSeries.description || '',
          longDescription: foundSeries.longDescription || '',
          website: foundSeries.website || '',
        });
        if (foundSeries.logo) {
          setLogoPreview(foundSeries.logo);
        }
      }
    }
  }, [partners, params.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const formDataToSend = new FormData();
      formDataToSend.append('partnerId', params.id);
      
      // 添加基本信息
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // 添加Logo文件（如果有新的）
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await fetch('/api/v1/partner/update', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        alert('系列更新成功！');
        router.push('/my-toilet');
      } else {
        alert('更新失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error updating series:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!series) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/my-toilet')}
          className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ← 返回我的ShitX
        </button>

        {/* 标题 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">✏️ 编辑系列</h1>
          <p className="text-gray-300">更新您的ShitX极速卡片系列信息</p>
        </div>

        {/* 编辑表单 */}
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
              <p className="text-xs text-gray-400 mt-1">上传新图片将替换当前Logo</p>
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
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
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

            {/* 系列信息（只读） */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">系列信息</h3>
              <div className="space-y-1 text-xs text-gray-500">
                <p>系列ID: {series.id}</p>
                <p>卡片名称: {series.nftName}</p>
                <p>总供应量: {series.totalSupply}</p>
                <p>创建时间: {series.createdAt ? new Date(series.createdAt).toLocaleString('zh-CN') : '未知'}</p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    更新中...
                  </span>
                ) : (
                  '保存更改'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}