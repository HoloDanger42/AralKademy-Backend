export const validateDriveUrl = (url) => {
  const googleDrivePattern = /^https:\/\/drive\.google\.com\/(file\/d\/|drive\/folders\/)/
  return googleDrivePattern.test(url)
}

export const generatePreviewUrl = (driveUrl) => {
  // Convert file URLs to preview URLs if needed
  if (driveUrl.includes('/file/d/')) {
    const fileId = driveUrl.match(/\/d\/([^/?]+)/)?.[1]
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
  }
  return driveUrl
}
