import jwt from 'jsonwebtoken'

const JWT_SECRET = 'hazmat-transport-secret-key-2026'
const JWT_EXPIRES_IN = '24h'

export const users = [
  {
    id: '1',
    username: 'admin_province',
    password: '123456',
    name: '省级监管员',
    role: 'provincial',
    region: '全国',
  },
  {
    id: '2',
    username: 'admin_city',
    password: '123456',
    name: '上海市监管员',
    role: 'municipal',
    region: '上海市',
    city: '上海',
  },
  {
    id: '3',
    username: 'admin_company',
    password: '123456',
    name: '华宇物流管理员',
    role: 'enterprise',
    company: '华宇危化物流有限公司',
  },
]

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    region: user.region,
    city: user.city,
    company: user.company,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证token' })
  }
  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Token无效或已过期' })
  }
  req.user = decoded
  next()
}
