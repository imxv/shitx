// 生成用户指纹
export function generateUserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return Math.random().toString(36).substring(7);
  }

  // Canvas 指纹
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('ShitX User', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('ShitX User', 4, 17);
  
  const canvasData = canvas.toDataURL();
  
  // 结合其他浏览器特征
  const features = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData
  ].join('|');
  
  // 生成哈希
  let hash = 0;
  for (let i = 0; i < features.length; i++) {
    const char = features.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// 生成用户名
export function generateUsername(fingerprint: string): string {
  const adjectives = [
    '便秘的', '腹泻的', '畅快的', '紧张的', '放松的',
    '忧郁的', '快乐的', '疯狂的', '理智的', '神秘的',
    '优雅的', '粗犷的', '细腻的', '豪放的', '内敛的'
  ];
  
  const nouns = [
    '马桶', '厕纸', '马桶刷', '清洁剂', '芳香剂',
    '排泄者', '如厕者', '冲水者', '蹲坑者', '思考者',
    '哲学家', '艺术家', '工程师', '设计师', '革命家'
  ];
  
  // 使用 fingerprint 作为种子来保证同一用户总是得到同样的名字
  const seed = parseInt(fingerprint.slice(0, 8), 36);
  const adjIndex = seed % adjectives.length;
  const nounIndex = (seed >> 8) % nouns.length;
  
  return adjectives[adjIndex] + nouns[nounIndex];
}

// 用户身份管理
export interface UserIdentity {
  id: string;
  fingerprint: string;
  username: string;
  createdAt: number;
  lastSeen: number;
  toiletVisits: number;
  referralSource?: string; // 来源合作方
  referralTimestamp?: number; // 首次访问时间
}

const USER_IDENTITY_KEY = 'shitx_user_identity';

export function getUserIdentity(referralSource?: string): UserIdentity {
  // 尝试从 localStorage 读取
  const stored = localStorage.getItem(USER_IDENTITY_KEY);
  
  if (stored) {
    try {
      const identity = JSON.parse(stored) as UserIdentity;
      // 更新最后访问时间
      identity.lastSeen = Date.now();
      identity.toiletVisits = (identity.toiletVisits || 0) + 1;
      
      // 如果有新的 referral 但用户还没有记录来源，记录首次来源
      if (referralSource && !identity.referralSource) {
        identity.referralSource = referralSource;
        identity.referralTimestamp = Date.now();
      }
      
      localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(identity));
      return identity;
    } catch (e) {
      console.error('Failed to parse user identity:', e);
    }
  }
  
  // 创建新用户
  const fingerprint = generateUserFingerprint();
  const identity: UserIdentity = {
    id: 'toilet_' + fingerprint,
    fingerprint,
    username: generateUsername(fingerprint),
    createdAt: Date.now(),
    lastSeen: Date.now(),
    toiletVisits: 1,
    ...(referralSource && {
      referralSource,
      referralTimestamp: Date.now()
    })
  };
  
  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

// 获取用户称号
export function getUserTitle(visits: number): string {
  if (visits >= 100) return '厕所之王';
  if (visits >= 50) return '资深蹲友';
  if (visits >= 20) return '常驻马桶';
  if (visits >= 10) return '厕所常客';
  if (visits >= 5) return '新晋蹲友';
  return '厕所新人';
}