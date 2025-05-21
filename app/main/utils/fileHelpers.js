// File handling utilities

export const readFileContent = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve({
        name: file.name,
        type: file.type,
        content: event.target.result,
        size: file.size
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'csv':
      return 'CSV';
    case 'pdf':
      return 'PDF';
    default:
      return extension.toUpperCase();
  }
};