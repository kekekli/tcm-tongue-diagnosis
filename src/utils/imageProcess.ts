export interface ImageProcessOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export const processImage = async (
  imageData: string,
  options: ImageProcessOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      // 计算缩放比例
      let { width, height } = img
      const aspectRatio = width / height

      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }
      
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      // 设置Canvas尺寸
      canvas.width = width
      canvas.height = height

      // 图片预处理
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, width, height)
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 应用图像增强
      enhanceImage(ctx, width, height)
      
      // 输出处理后的图片
      const mimeType = `image/${format}`
      const processedImage = canvas.toDataURL(mimeType, quality)
      
      resolve(processedImage)
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = imageData
  })
}

const enhanceImage = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // 应用对比度和亮度调整
  const contrast = 1.1
  const brightness = 5

  for (let i = 0; i < data.length; i += 4) {
    // RGB值处理
    for (let j = 0; j < 3; j++) {
      let value = data[i + j]
      
      // 应用对比度
      value = (value - 128) * contrast + 128
      
      // 应用亮度
      value += brightness
      
      // 限制在0-255范围内
      data[i + j] = Math.max(0, Math.min(255, value))
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export const cropToCircle = async (imageData: string, radius?: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const cropRadius = radius || size / 2
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      canvas.width = cropRadius * 2
      canvas.height = cropRadius * 2

      // 创建圆形裁剪路径
      ctx.beginPath()
      ctx.arc(cropRadius, cropRadius, cropRadius, 0, Math.PI * 2)
      ctx.clip()

      // 计算居中位置
      const x = (img.width - cropRadius * 2) / 2
      const y = (img.height - cropRadius * 2) / 2

      // 绘制图片
      ctx.drawImage(
        img,
        x, y, cropRadius * 2, cropRadius * 2,
        0, 0, cropRadius * 2, cropRadius * 2
      )

      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = imageData
  })
}

export const detectTongueArea = async (imageData: string): Promise<{
  x: number
  y: number
  width: number
  height: number
}> => {
  // 这里可以集成AI模型来检测舌头区域
  // 简化实现：返回图片中心区域
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      const centerX = img.width * 0.2
      const centerY = img.height * 0.2
      const width = img.width * 0.6
      const height = img.height * 0.6
      
      resolve({ x: centerX, y: centerY, width, height })
    }
    
    img.src = imageData
  })
}

export const analyzeImageQuality = async (imageData: string): Promise<{
  blur: number
  brightness: number
  contrast: number
  quality: 'good' | 'fair' | 'poor'
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 计算亮度
      let brightness = 0
      let contrast = 0
      let totalPixels = data.length / 4

      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
        brightness += gray
      }
      brightness = brightness / totalPixels / 255

      // 计算对比度（标准差）
      let variance = 0
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
        variance += Math.pow(gray - brightness, 2)
      }
      contrast = Math.sqrt(variance / totalPixels)

      // 简化的模糊检测（基于边缘检测）
      const blur = detectBlur(data, canvas.width, canvas.height)

      // 评估整体质量
      let quality: 'good' | 'fair' | 'poor' = 'poor'
      
      if (brightness > 0.3 && brightness < 0.8 && contrast > 0.1 && blur < 0.5) {
        quality = 'good'
      } else if (brightness > 0.2 && brightness < 0.9 && contrast > 0.05 && blur < 0.7) {
        quality = 'fair'
      }

      resolve({
        blur,
        brightness,
        contrast,
        quality
      })
    }
    
    img.onerror = () => {
      reject(new Error('图片分析失败'))
    }
    
    img.src = imageData
  })
}

const detectBlur = (data: Uint8ClampedArray, width: number, height: number): number => {
  // 简化的Sobel边缘检测
  let edgeStrength = 0
  let pixelCount = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      
      // 获取灰度值
      const getGray = (i: number) => (data[i] + data[i + 1] + data[i + 2]) / 3
      
      // Sobel算子
      const gx = 
        -getGray(((y - 1) * width + (x - 1)) * 4) +
        getGray(((y - 1) * width + (x + 1)) * 4) +
        -2 * getGray((y * width + (x - 1)) * 4) +
        2 * getGray((y * width + (x + 1)) * 4) +
        -getGray(((y + 1) * width + (x - 1)) * 4) +
        getGray(((y + 1) * width + (x + 1)) * 4)
      
      const gy =
        -getGray(((y - 1) * width + (x - 1)) * 4) +
        -2 * getGray(((y - 1) * width + x) * 4) +
        -getGray(((y - 1) * width + (x + 1)) * 4) +
        getGray(((y + 1) * width + (x - 1)) * 4) +
        2 * getGray(((y + 1) * width + x) * 4) +
        getGray(((y + 1) * width + (x + 1)) * 4)
      
      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edgeStrength += magnitude
      pixelCount++
    }
  }

  const averageEdgeStrength = edgeStrength / pixelCount
  return Math.max(0, Math.min(1, 1 - averageEdgeStrength / 255))
}

export const resizeImage = async (
  imageData: string,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio = true
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      let { width, height } = img
      
      if (maintainAspectRatio) {
        const aspectRatio = width / height
        
        if (width > height) {
          width = targetWidth
          height = targetWidth / aspectRatio
        } else {
          height = targetHeight
          width = targetHeight * aspectRatio
        }
      } else {
        width = targetWidth
        height = targetHeight
      }

      canvas.width = width
      canvas.height = height
      
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    
    img.onerror = () => {
      reject(new Error('图片缩放失败'))
    }
    
    img.src = imageData
  })
}