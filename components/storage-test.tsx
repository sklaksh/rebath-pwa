'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export function StorageTest() {
  const [testing, setTesting] = useState(false)

  const testStorage = async () => {
    setTesting(true)
    try {
      console.log('Testing Supabase Storage...')
      
      // Test 1: Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated')
        return
      }
      console.log('✅ User authenticated:', user.id)
      
      // Test 2: Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError)
        toast.error(`Error listing buckets: ${bucketsError.message}`)
        return
      }
      
      const assessmentPhotosBucket = buckets.find(bucket => bucket.id === 'assessment-photos')
      if (!assessmentPhotosBucket) {
        console.error('❌ assessment-photos bucket not found')
        toast.error(`assessment-photos bucket not found. Available buckets: ${buckets.map(b => b.id).join(', ')}`)
        return
      }
      console.log('✅ assessment-photos bucket found:', assessmentPhotosBucket)
      
      // Test 3: Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('assessment-photos')
        .list(user.id, { limit: 1 })
      
      if (filesError) {
        console.error('❌ Error listing files:', filesError)
        toast.error(`Error listing files: ${filesError.message}`)
        return
      }
      console.log('✅ Can list files in bucket')
      
      // Test 4: Create a test file
      const testContent = 'test file content'
      const testFileName = `test-${Date.now()}.txt`
      const testPath = `${user.id}/test/${testFileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assessment-photos')
        .upload(testPath, testContent, {
          contentType: 'text/plain'
        })
      
      if (uploadError) {
        console.error('❌ Error uploading test file:', uploadError)
        toast.error(`Error uploading test file: ${uploadError.message}`)
        return
      }
      console.log('✅ Test file uploaded:', uploadData)
      
      // Test 5: Delete the test file
      const { error: deleteError } = await supabase.storage
        .from('assessment-photos')
        .remove([testPath])
      
      if (deleteError) {
        console.error('❌ Error deleting test file:', deleteError)
        toast.error(`Error deleting test file: ${deleteError.message}`)
        return
      }
      console.log('✅ Test file deleted')
      
      toast.success('✅ All storage tests passed!')
      
    } catch (error) {
      console.error('❌ Storage test error:', error)
      toast.error(`Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Storage Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test Supabase Storage configuration and permissions
      </p>
      <Button 
        onClick={testStorage} 
        disabled={testing}
        variant="outline"
      >
        {testing ? 'Testing...' : 'Test Storage'}
      </Button>
    </div>
  )
}
