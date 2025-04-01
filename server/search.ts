/**
 * Search Service
 * 
 * Provides search functionality across notes, assignments, and past papers
 */

import { Pool } from 'pg';
import { Request, Response } from 'express';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Record a search query
 * 
 * @param userId User ID
 * @param query Search query
 * @param resultCount Number of results found
 */
export async function recordSearchQuery(userId: number, query: string, resultCount: number): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO search_queries (user_id, query, result_count) VALUES ($1, $2, $3)',
      [userId, query, resultCount]
    );
  } catch (error) {
    console.error('Error recording search query:', error);
  }
}

/**
 * Search for content across notes, assignments, and past papers
 * 
 * @param query Search query
 * @param userId User ID
 * @param unitCode Optional unit code to filter by
 * @param contentType Optional content type to filter by ('notes', 'assignments', 'papers')
 * @param limit Maximum number of results to return
 */
export async function searchContent(
  query: string, 
  userId: number, 
  unitCode?: string, 
  contentType?: string,
  limit: number = 20
): Promise<any[]> {
  try {
    // Basic sanitization
    const searchTerm = query.replace(/[^\w\s]/gi, '').trim();
    if (!searchTerm) {
      return [];
    }
    
    // Build search conditions
    const unitCondition = unitCode ? `AND unit_code = '${unitCode}'` : '';
    
    // Build search patterns for SQL LIKE
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    let results: any[] = [];
    
    // Search in notes
    if (!contentType || contentType === 'notes') {
      const notesQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS unitCode, 
          user_id AS userId, 
          created_at AS createdAt,
          'note' AS type
        FROM 
          notes 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          created_at DESC
        LIMIT $2
      `;
      
      const notesResult = await pool.query(notesQuery, [searchPattern, limit]);
      results = [...results, ...notesResult.rows];
    }
    
    // Search in assignments
    if (!contentType || contentType === 'assignments') {
      const assignmentsQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS unitCode, 
          user_id AS userId, 
          deadline,
          created_at AS createdAt,
          'assignment' AS type
        FROM 
          assignments 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          deadline ASC
        LIMIT $2
      `;
      
      const assignmentsResult = await pool.query(assignmentsQuery, [searchPattern, limit]);
      results = [...results, ...assignmentsResult.rows];
    }
    
    // Search in past papers
    if (!contentType || contentType === 'papers') {
      const papersQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS unitCode, 
          user_id AS userId, 
          year,
          created_at AS createdAt,
          'paper' AS type
        FROM 
          past_papers 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          year DESC
        LIMIT $2
      `;
      
      const papersResult = await pool.query(papersQuery, [searchPattern, limit]);
      results = [...results, ...papersResult.rows];
    }
    
    // Record the search
    await recordSearchQuery(userId, query, results.length);
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Get search suggestions based on previous searches
 * 
 * @param query Partial search query
 * @param limit Maximum number of suggestions to return
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  try {
    const searchPattern = `${query.toLowerCase()}%`;
    
    const suggestionsQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        LOWER(query) LIKE $1
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT $2
    `;
    
    const result = await pool.query(suggestionsQuery, [searchPattern, limit]);
    return result.rows.map(row => row.query);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

/**
 * Handle search request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleSearch(req: Request, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not found in session' });
    }
    
    const { query, unitCode, contentType, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = await searchContent(
      query,
      userId,
      typeof unitCode === 'string' ? unitCode : undefined,
      typeof contentType === 'string' ? contentType : undefined,
      typeof limit === 'string' ? parseInt(limit, 10) : 20
    );
    
    return res.json({ results });
  } catch (error) {
    console.error('Search handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Handle search suggestions request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleSearchSuggestions(req: Request, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    
    const suggestions = await getSearchSuggestions(
      query,
      typeof limit === 'string' ? parseInt(limit, 10) : 5
    );
    
    return res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get trending searches
 * 
 * @param limit Maximum number of trending searches to return
 */
export async function getTrendingSearches(limit: number = 5): Promise<string[]> {
  try {
    const trendingQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        timestamp > NOW() - INTERVAL '7 days'
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT $1
    `;
    
    const result = await pool.query(trendingQuery, [limit]);
    return result.rows.map(row => row.query);
  } catch (error) {
    console.error('Error getting trending searches:', error);
    return [];
  }
}

/**
 * Handle trending searches request
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleTrendingSearches(req: Request, res: Response): Promise<Response | undefined> {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { limit } = req.query;
    
    const trending = await getTrendingSearches(
      typeof limit === 'string' ? parseInt(limit, 10) : 5
    );
    
    return res.json({ trending });
  } catch (error) {
    console.error('Trending searches handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}