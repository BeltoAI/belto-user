// Hook to monitor and ensure response quality

import { useCallback } from 'react';

export const useResponseQualityMonitor = () => {
  
  const analyzeResponseQuality = useCallback((response, context = {}) => {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: [],
      metrics: {}
    };

    // Basic metrics
    analysis.metrics.length = response.length;
    analysis.metrics.words = response.split(/\s+/).length;
    analysis.metrics.sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Length quality checks
    if (response.length < 20) {
      analysis.issues.push('Response too short');
      analysis.recommendations.push('Increase token limits for more complete responses');
      analysis.score -= 30;
    } else if (response.length < 50) {
      analysis.issues.push('Response potentially incomplete');
      analysis.recommendations.push('Consider increasing token limits');
      analysis.score -= 15;
    } else if (response.length > 100) {
      analysis.score += 20; // Good length
    }

    // Content quality checks
    const lowerResponse = response.toLowerCase();

    // Check for BELTO AI identity
    if (lowerResponse.includes('belto') || lowerResponse.includes('belto ai')) {
      analysis.score += 10;
    } else if (context.isGreeting) {
      analysis.issues.push('Missing BELTO AI identity in greeting');
      analysis.recommendations.push('Ensure identity is mentioned in greetings');
    }

    // Check for educational keywords
    const educationalKeywords = ['explain', 'learn', 'understand', 'study', 'concept', 'example', 'step', 'solution'];
    const hasEducationalContent = educationalKeywords.some(keyword => lowerResponse.includes(keyword));
    if (hasEducationalContent) {
      analysis.score += 15;
    }

    // Check for completeness indicators
    const completenessIndicators = ['complete', 'comprehensive', 'detailed', 'thorough', 'in summary', 'to conclude'];
    const hasCompleteness = completenessIndicators.some(indicator => lowerResponse.includes(indicator));
    if (hasCompleteness) {
      analysis.score += 10;
    }

    // Check for system artifacts (bad)
    const systemArtifacts = ['we need to', 'the user', 'critical identity', 'so we respond', 'let\'s'];
    const hasArtifacts = systemArtifacts.some(artifact => lowerResponse.includes(artifact));
    if (hasArtifacts) {
      analysis.issues.push('Contains system reasoning artifacts');
      analysis.recommendations.push('Improve response cleaning function');
      analysis.score -= 25;
    }

    // Check for truncation indicators
    const truncationIndicators = ['...', 'etc.', 'and so on', 'to be continued'];
    const appearsTruncated = truncationIndicators.some(indicator => response.endsWith(indicator));
    if (appearsTruncated) {
      analysis.issues.push('Response appears truncated');
      analysis.recommendations.push('Increase token limits to allow complete responses');
      analysis.score -= 20;
    }

    // Document analysis quality (if context indicates document processing)
    if (context.hasDocument) {
      if (response.length < 200) {
        analysis.issues.push('Document analysis too brief');
        analysis.recommendations.push('Increase token limits for document processing');
        analysis.score -= 20;
      }
      
      const analysisKeywords = ['analysis', 'document', 'content', 'summary', 'key points', 'main ideas'];
      const hasAnalysisContent = analysisKeywords.some(keyword => lowerResponse.includes(keyword));
      if (hasAnalysisContent) {
        analysis.score += 15;
      } else {
        analysis.issues.push('Lacks document analysis content');
      }
    }

    // Math/science response quality
    if (context.isMathOrScience) {
      const hasSteps = /step \d|first|then|next|finally/i.test(response);
      const hasExamples = /example|for instance|such as/i.test(response);
      
      if (hasSteps) analysis.score += 10;
      if (hasExamples) analysis.score += 10;
      
      if (!hasSteps && !hasExamples) {
        analysis.issues.push('Math/science response lacks structure');
        analysis.recommendations.push('Encourage step-by-step explanations and examples');
      }
    }

    // Final score calculation (0-100 scale)
    analysis.score = Math.max(0, Math.min(100, analysis.score + 50)); // Base score of 50

    // Overall quality rating
    if (analysis.score >= 80) {
      analysis.rating = 'Excellent';
    } else if (analysis.score >= 65) {
      analysis.rating = 'Good';
    } else if (analysis.score >= 50) {
      analysis.rating = 'Fair';
    } else {
      analysis.rating = 'Poor';
    }

    return analysis;
  }, []);

  const logQualityMetrics = useCallback((response, context, sessionId) => {
    const analysis = analyzeResponseQuality(response, context);
    
    console.log('📊 Response Quality Analysis:', {
      sessionId: sessionId?.substring(0, 8) + '...',
      rating: analysis.rating,
      score: analysis.score,
      length: analysis.metrics.length,
      words: analysis.metrics.words,
      issues: analysis.issues.length,
      recommendations: analysis.recommendations.length
    });

    if (analysis.issues.length > 0) {
      console.warn('⚠️ Quality Issues Found:', analysis.issues);
      console.log('💡 Recommendations:', analysis.recommendations);
    }

    // Log to analytics if quality is poor
    if (analysis.score < 50) {
      console.error('🚨 Poor Quality Response Detected:', {
        score: analysis.score,
        issues: analysis.issues,
        response: response.substring(0, 100) + '...'
      });
    }

    return analysis;
  }, [analyzeResponseQuality]);

  return {
    analyzeResponseQuality,
    logQualityMetrics
  };
};
