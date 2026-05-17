import { applyLeadFilter, applyTaskFilter } from './data-filters'
import { UserProfile } from '@/types'

// Mock PostgrestFilterBuilder
const createMockQuery = () => {
  const query: any = {
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
  }
  return query
}

describe('Data Filters', () => {
  describe('applyLeadFilter', () => {
    it('Test 1 - Admin sees all leads', () => {
      const profile = { role: 'admin' } as UserProfile
      const query = createMockQuery()
      
      const result = applyLeadFilter(query, profile)
      
      expect(result).toBe(query)
      expect(query.eq).not.toHaveBeenCalled()
      expect(query.or).not.toHaveBeenCalled()
    })

    it('Test 2 - Sales with assigned_courses sees filtered leads', () => {
      const profile = { role: 'sales', id: 'user-1', assigned_courses: ['IELTS', 'TOEIC'] } as UserProfile
      const query = createMockQuery()
      
      applyLeadFilter(query, profile)
      
      expect(query.or).toHaveBeenCalledWith(`course_interest.in.(IELTS,TOEIC),assigned_to.eq.user-1`)
    })

    it('Test 3 - Sales with empty assigned_courses', () => {
      const profile = { role: 'sales', id: 'user-1', assigned_courses: [] } as UserProfile
      const query = createMockQuery()
      
      applyLeadFilter(query, profile)
      
      expect(query.eq).toHaveBeenCalledWith('assigned_to', 'user-1')
      expect(query.or).not.toHaveBeenCalled()
    })

    it('Test 4 - Null profile returns unfiltered (guest/loading state)', () => {
      const query = createMockQuery()
      
      const result = applyLeadFilter(query, null)
      
      expect(result).toBe(query)
      expect(query.eq).not.toHaveBeenCalled()
      expect(query.or).not.toHaveBeenCalled()
    })
  })
})
