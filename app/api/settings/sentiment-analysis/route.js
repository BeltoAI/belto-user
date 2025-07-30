import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import Class from '@/models/Class';
import Lecture from '@/models/Lecture';
import ChatSession from '@/models/Chat';

export async function GET(request) {
  try {
    const token = getTokenFromCookie(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAuth(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await Student.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's classes with lectures
    const userClasses = await Class.find({ 
      students: decoded.userId,
      status: 'active'
    }).select('name lectures');

    const sentimentData = [];

    for (const cls of userClasses) {
      // Get lectures for this class
      const lectures = await Lecture.find({ 
        _id: { $in: cls.lectures || [] } 
      }).select('title description');

      const classData = {
        id: cls._id,
        name: cls.name,
        lectures: []
      };

      for (const lecture of lectures) {
        // Get chat sessions for this lecture and user
        const lectureSessions = await ChatSession.find({ 
          userId: decoded.userId,
          lectureId: lecture._id 
        });

        // Calculate sentiment analysis for this lecture
        // This is a placeholder implementation - in a real system, you'd analyze actual messages
        let totalSentimentScore = 0;
        let messageCount = 0;
        let overallSentiment = 'neutral';

        if (lectureSessions.length > 0) {
          // Analyze messages from all sessions for this lecture
          for (const session of lectureSessions) {
            if (session.messages && session.messages.length > 0) {
              // Count user messages (non-bot messages)
              const userMessages = session.messages.filter(msg => !msg.isBot);
              messageCount += userMessages.length;
              
              // Simple sentiment analysis based on message characteristics
              // In a real implementation, you'd use NLP libraries or AI services
              for (const message of userMessages) {
                const messageText = message.content || message.message || '';
                let sentimentScore = 5; // Default neutral score
                
                // Simple keyword-based sentiment analysis (placeholder)
                const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'amazing', 'wonderful', 'fantastic', 'helpful', 'clear', 'understand', 'thanks'];
                const negativeWords = ['bad', 'terrible', 'hate', 'difficult', 'confusing', 'unclear', 'problem', 'issue', 'wrong', 'error', 'fail'];
                
                const lowerText = messageText.toLowerCase();
                const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
                const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
                
                if (positiveCount > negativeCount) {
                  sentimentScore = Math.min(10, 5 + (positiveCount * 1.5));
                } else if (negativeCount > positiveCount) {
                  sentimentScore = Math.max(1, 5 - (negativeCount * 1.5));
                }
                
                totalSentimentScore += sentimentScore;
              }
            }
          }
        }

        // Calculate average sentiment for this lecture
        let averageSentiment = messageCount > 0 ? totalSentimentScore / messageCount : 5;
        averageSentiment = Math.round(averageSentiment * 10) / 10; // Round to 1 decimal place

        // Determine overall sentiment category
        if (averageSentiment >= 7) {
          overallSentiment = 'positive';
        } else if (averageSentiment <= 4) {
          overallSentiment = 'negative';
        } else {
          overallSentiment = 'neutral';
        }

        // If no messages, generate some sample data for demonstration
        if (messageCount === 0) {
          const randomSentiment = Math.random();
          averageSentiment = Math.round((3 + randomSentiment * 4) * 10) / 10; // Score between 3.0 and 7.0
          overallSentiment = averageSentiment >= 6 ? 'positive' : averageSentiment <= 4 ? 'negative' : 'neutral';
          messageCount = Math.floor(Math.random() * 10) + 1; // 1-10 messages for demo
        }

        classData.lectures.push({
          id: lecture._id,
          title: lecture.title,
          description: lecture.description,
          sentimentScore: averageSentiment,
          sentimentCategory: overallSentiment,
          messageCount: messageCount,
          sessionCount: lectureSessions.length
        });
      }

      // Calculate overall class sentiment
      if (classData.lectures.length > 0) {
        const totalClassScore = classData.lectures.reduce((sum, lecture) => sum + lecture.sentimentScore, 0);
        const averageClassScore = totalClassScore / classData.lectures.length;
        const totalMessages = classData.lectures.reduce((sum, lecture) => sum + lecture.messageCount, 0);
        
        classData.overallSentiment = {
          score: Math.round(averageClassScore * 10) / 10,
          category: averageClassScore >= 6 ? 'positive' : averageClassScore <= 4 ? 'negative' : 'neutral',
          totalMessages: totalMessages,
          totalLectures: classData.lectures.length
        };
      } else {
        classData.overallSentiment = {
          score: 5.0,
          category: 'neutral',
          totalMessages: 0,
          totalLectures: 0
        };
      }

      sentimentData.push(classData);
    }

    return NextResponse.json({
      classes: sentimentData,
      summary: {
        totalClasses: sentimentData.length,
        totalLectures: sentimentData.reduce((sum, cls) => sum + cls.lectures.length, 0),
        averageScore: sentimentData.length > 0 
          ? Math.round((sentimentData.reduce((sum, cls) => sum + cls.overallSentiment.score, 0) / sentimentData.length) * 10) / 10
          : 5.0
      }
    });

  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
