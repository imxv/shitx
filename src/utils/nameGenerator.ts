// 中文姓氏
const CHINESE_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕'
];

// 中文名字
const CHINESE_GIVEN_NAMES = [
  '小明', '小红', '小华', '小强', '小美', '小军', '小丽', '小芳', '小伟', '小燕',
  '建国', '建华', '建军', '秀英', '桂英', '玉兰', '凤英', '秀兰', '桂兰', '玉梅',
  '志强', '志明', '志华', '志军', '志伟', '文明', '文华', '文军', '文杰', '文静',
  '雨萱', '梦琪', '雅静', '韵寒', '莉姿', '梦洁', '凌薇', '美莲', '雅楠', '雨婷',
  '晓明', '晓华', '晓军', '晓红', '晓燕', '晓峰', '晓东', '晓西', '晓南', '晓北'
];

// 西方名字
const WESTERN_FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Helen', 'Donald', 'Sandra', 'Mark', 'Donna',
  'Paul', 'Carol', 'Steven', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Liam', 'Noah', 'Oliver',
  'Elijah', 'William', 'Lucas', 'Mason', 'Ethan', 'Logan', 'Jackson', 'Aiden'
];

// 西方姓氏
const WESTERN_SURNAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell'
];

// 生成随机名字
export const generateRandomName = (): string => {
  // 50% 概率生成中文名字，50% 西方名字
  if (Math.random() < 0.5) {
    // 中文名字
    const surname = CHINESE_SURNAMES[Math.floor(Math.random() * CHINESE_SURNAMES.length)];
    const givenName = CHINESE_GIVEN_NAMES[Math.floor(Math.random() * CHINESE_GIVEN_NAMES.length)];
    return `${surname}${givenName}`;
  } else {
    // 西方名字
    const firstName = WESTERN_FIRST_NAMES[Math.floor(Math.random() * WESTERN_FIRST_NAMES.length)];
    const surname = WESTERN_SURNAMES[Math.floor(Math.random() * WESTERN_SURNAMES.length)];
    return `${firstName} ${surname}`;
  }
};

// 生成指定数量的不重复名字
export const generateUniqueNames = (count: number): string[] => {
  const names = new Set<string>();
  
  // 生成足够多的不重复名字
  while (names.size < count) {
    names.add(generateRandomName());
  }
  
  return Array.from(names);
};