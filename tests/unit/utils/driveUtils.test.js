<<<<<<< HEAD
import { validateDriveUrl, generatePreviewUrl } from '../../../src/utils/driveUtils'

describe('Drive Utilities', () => {
  describe('validateDriveUrl', () => {
    test('should return true for valid Google Drive file URLs', () => {
      const validFileUrl = 'https://drive.google.com/file/d/1234567890abcdef/view'
      expect(validateDriveUrl(validFileUrl)).toBe(true)
    })

    test('should return true for valid Google Drive folder URLs', () => {
      const validFolderUrl = 'https://drive.google.com/drive/folders/1234567890abcdef'
      expect(validateDriveUrl(validFolderUrl)).toBe(true)
    })

    test('should return false for invalid Google Drive URLs', () => {
      const invalidUrls = [
        'https://drive.google.com/other/1234567890',
        'https://docs.google.com/document/d/123456',
        'https://example.com/file',
        'not-a-url',
      ]

      invalidUrls.forEach((url) => {
        expect(validateDriveUrl(url)).toBe(false)
      })
    })
  })

  describe('generatePreviewUrl', () => {
    test('should convert file URLs to preview URLs', () => {
      const fileUrl = 'https://drive.google.com/file/d/1234567890abcdef/view'
      const expectedPreviewUrl = 'https://drive.google.com/file/d/1234567890abcdef/preview'

      expect(generatePreviewUrl(fileUrl)).toBe(expectedPreviewUrl)
    })

    test('should handle file URLs with different query parameters', () => {
      const fileUrl = 'https://drive.google.com/file/d/1234567890abcdef?usp=sharing'
      const expectedPreviewUrl = 'https://drive.google.com/file/d/1234567890abcdef/preview'

      expect(generatePreviewUrl(fileUrl)).toBe(expectedPreviewUrl)
    })

    test('should return the original URL for folder URLs', () => {
      const folderUrl = 'https://drive.google.com/drive/folders/1234567890abcdef'
      expect(generatePreviewUrl(folderUrl)).toBe(folderUrl)
    })

    test('should return the original URL for non-Google Drive URLs', () => {
      const nonDriveUrl = 'https://example.com/file'
      expect(generatePreviewUrl(nonDriveUrl)).toBe(nonDriveUrl)
    })
  })
})
=======
import { validateDriveUrl, generatePreviewUrl } from '../../../src/utils/driveUtils'

describe('Drive Utilities', () => {
  describe('validateDriveUrl', () => {
    test('should return true for valid Google Drive file URLs', () => {
      const validFileUrl = 'https://drive.google.com/file/d/1234567890abcdef/view'
      expect(validateDriveUrl(validFileUrl)).toBe(true)
    })

    test('should return true for valid Google Drive folder URLs', () => {
      const validFolderUrl = 'https://drive.google.com/drive/folders/1234567890abcdef'
      expect(validateDriveUrl(validFolderUrl)).toBe(true)
    })

    test('should return false for invalid Google Drive URLs', () => {
      const invalidUrls = [
        'https://drive.google.com/other/1234567890',
        'https://docs.google.com/document/d/123456',
        'https://example.com/file',
        'not-a-url',
      ]

      invalidUrls.forEach((url) => {
        expect(validateDriveUrl(url)).toBe(false)
      })
    })
  })

  describe('generatePreviewUrl', () => {
    test('should convert file URLs to preview URLs', () => {
      const fileUrl = 'https://drive.google.com/file/d/1234567890abcdef/view'
      const expectedPreviewUrl = 'https://drive.google.com/file/d/1234567890abcdef/preview'

      expect(generatePreviewUrl(fileUrl)).toBe(expectedPreviewUrl)
    })

    test('should handle file URLs with different query parameters', () => {
      const fileUrl = 'https://drive.google.com/file/d/1234567890abcdef?usp=sharing'
      const expectedPreviewUrl = 'https://drive.google.com/file/d/1234567890abcdef/preview'

      expect(generatePreviewUrl(fileUrl)).toBe(expectedPreviewUrl)
    })

    test('should return the original URL for folder URLs', () => {
      const folderUrl = 'https://drive.google.com/drive/folders/1234567890abcdef'
      expect(generatePreviewUrl(folderUrl)).toBe(folderUrl)
    })

    test('should return the original URL for non-Google Drive URLs', () => {
      const nonDriveUrl = 'https://example.com/file'
      expect(generatePreviewUrl(nonDriveUrl)).toBe(nonDriveUrl)
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d
