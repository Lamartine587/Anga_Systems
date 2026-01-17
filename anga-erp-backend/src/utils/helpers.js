class Helpers {
    static generateRandomString(length = 10) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
    
    static formatCurrency(amount, currency = 'KES') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency
      }).format(amount);
    }
    
    static formatDate(date, format = 'dd/MM/yyyy') {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      
      switch (format) {
        case 'dd/MM/yyyy':
          return `${day}/${month}/${year}`;
        case 'yyyy-MM-dd':
          return `${year}-${month}-${day}`;
        case 'MM/dd/yyyy':
          return `${month}/${day}/${year}`;
        default:
          return d.toLocaleDateString();
      }
    }
    
    static calculateAge(birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    }
    
    static paginate(array, page = 1, limit = 10) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      const results = {};
      
      if (endIndex < array.length) {
        results.next = {
          page: page + 1,
          limit: limit
        };
      }
      
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit
        };
      }
      
      results.data = array.slice(startIndex, endIndex);
      results.total = array.length;
      results.page = page;
      results.limit = limit;
      results.pages = Math.ceil(array.length / limit);
      
      return results;
    }
    
    static validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
    
    static validatePhone(phone) {
      // Basic phone validation for Kenyan numbers
      const re = /^(\+254|0)[17]\d{8}$/;
      return re.test(phone.replace(/\s+/g, ''));
    }
    
    static escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    }
    
    static truncateText(text, length = 100) {
      if (text.length <= length) return text;
      return text.substr(0, length) + '...';
    }
    
    static generateSlug(text) {
      return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }
    
    static async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static isObjectEmpty(obj) {
      return Object.keys(obj).length === 0;
    }
    
    static deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    
    static getFileExtension(filename) {
      return filename.split('.').pop();
    }
    
    static formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
  
  module.exports = Helpers;