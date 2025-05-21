'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import styles from './LectureDetails.module.css';

const LectureDetails = ({ classId, lectureId }) => {
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLectureDetails = async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/lectures/${lectureId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch lecture details');
        }
        const data = await response.json();
        setLecture(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (classId && lectureId) {
      fetchLectureDetails();
    }
  }, [classId, lectureId]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!lecture) {
    return <div className={styles.info}>No lecture details found</div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return styles.statusCompleted;
      case 'in-progress': return styles.statusInProgress;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusScheduled;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{lecture.title}</h1>

      <div className={styles.statusContainer}>
        <span className={`${styles.status} ${getStatusClass(lecture.status)}`}>
          {lecture.status}
        </span>
      </div>

      <p className={styles.description}>{lecture.description}</p>

      <div className={styles.timeInfo}>
        <p>Start: {format(new Date(lecture.startDate), 'PPp')}</p>
        <p>End: {format(new Date(lecture.endDate), 'PPp')}</p>
      </div>

      {lecture.materials && lecture.materials.length > 0 && (
        <div className={styles.section}>
          <h2>Materials</h2>
          <div className={styles.materialsList}>
            {lecture.materials.map((material, index) => (
              <div key={index} className={styles.material}>
                {material.title} ({material.fileType})
              </div>
            ))}
          </div>
        </div>
      )}

      {lecture.faqs && lecture.faqs.length > 0 && (
        <div className={styles.section}>
          <h2>FAQs</h2>
          <div className={styles.faqList}>
            {lecture.faqs.map((faq, index) => (
              <div key={index} className={styles.faq}>
                <p className={styles.question}>Q: {faq.question}</p>
                <p className={styles.answer}>A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lecture.attendance && lecture.attendance.length > 0 && (
        <div className={styles.section}>
          <h2>Attendance ({lecture.attendance.length} students)</h2>
          <div className={styles.attendanceList}>
            {lecture.attendance.map((record, index) => (
              <div key={index} className={styles.attendanceRecord}>
                {record.student?.name} - {record.status}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureDetails;
