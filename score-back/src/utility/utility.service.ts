import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
  onlyLettersAndNumbers(str: string): boolean {
    return /^[\u0600-\u06FFA-Za-z0-9._/,-\s\u200C]*$/.test(str);
  }

  randomString(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrs123456789'.split(
      '',
    );

    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function pickRandom(arr) {
      return arr[getRandomInt(0, arr.length)];
    }

    let s = '';
    while (length--) s += pickRandom(chars);
    return s;
  }

  getPersianDate = (date?: Date | number): string => {
    const targetDate = date ? new Date(date) : new Date();
    return new Intl.DateTimeFormat('fa', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      numberingSystem: 'latn',
    }).format(targetDate);
  };

  toShamsi = (dateInt: string | null | undefined) => {
    if (!dateInt) return '';
    var dateFormat = new Intl.DateTimeFormat('fa', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      numberingSystem: 'latn',
    });

    return dateFormat.format(new Date(dateInt).getTime());
  };
}
