'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { transferApi, TransferRequest, EstelamResponse } from './api/apis';

export default function TransferPage() {
  const [formData, setFormData] = useState<TransferRequest>({
    fromNationalCode: '',
    fromAccountNumber: '',
    toNationalCode: '',
    toAccountNumber: '',
    score: 0,
    referenceCode: '',
    description: '',
  });

  const [estelamData, setEstelamData] = useState<EstelamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEstelam, setShowEstelam] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'score' ? Number(value) : value
    }));
  };

  const handleEstelam = async () => {
    if (!formData.fromNationalCode || !formData.fromAccountNumber || 
        !formData.toNationalCode || !formData.toAccountNumber || !formData.score) {
      toast.error('لطفاً تمام فیلدهای مورد نیاز را پر کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await transferApi.estelamTransfer(formData);
      if (response.status === 200) {
        const data = await response.json();
        setEstelamData(data.data);
        setShowEstelam(true);
        toast.success('اطلاعات استعلام دریافت شد');
      } else {
        toast.error('خطا در استعلام اطلاعات');
      }
    } catch (error) {
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const response = await transferApi.transferScore(formData);
      if (response.status === 200) {
        toast.success('انتقال امتیاز با موفقیت انجام شد');
        // Reset form
        setFormData({
          fromNationalCode: '',
          fromAccountNumber: '',
          toNationalCode: '',
          toAccountNumber: '',
          score: 0,
          referenceCode: '',
          description: '',
        });
        setEstelamData(null);
        setShowEstelam(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'خطا در انتقال امتیاز');
      }
    } catch (error) {
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, maxLength: number) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    if (value.length <= maxLength) {
      handleInputChange({
        target: {
          name: e.target.name,
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            انتقال امتیاز
          </h1>

          {showTransferForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  اطلاعات مبدا
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد ملی مبدا
                    </label>
                    <input
                      type="text"
                      name="fromNationalCode"
                      value={formData.fromNationalCode}
                      onChange={(e) => handleInput(e, 11)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="کد ملی مبدا را وارد کنید"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره حساب مبدا
                    </label>
                    <input
                      type="text"
                      name="fromAccountNumber"
                      value={formData.fromAccountNumber}
                      onChange={(e) => handleInput(e, 16)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="شماره حساب مبدا را وارد کنید"
                      maxLength={16}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  اطلاعات مقصد
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد ملی مقصد
                    </label>
                    <input
                      type="text"
                      name="toNationalCode"
                      value={formData.toNationalCode}
                      onChange={(e) => handleInput(e, 11)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="کد ملی مقصد را وارد کنید"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره حساب مقصد
                    </label>
                    <input
                      type="text"
                      name="toAccountNumber"
                      value={formData.toAccountNumber}
                      onChange={(e) => handleInput(e, 16)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="شماره حساب مقصد را وارد کنید"
                      maxLength={16}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مقدار امتیاز
                    </label>
                    <input
                      type="number"
                      name="score"
                      value={formData.score || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مقدار امتیاز را وارد کنید"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد مرجع (اختیاری)
                    </label>
                    <input
                      type="text"
                      name="referenceCode"
                      value={formData.referenceCode}
                      onChange={(e) => handleInput(e, 20)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="کد مرجع"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="توضیحات انتقال"
                  />
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleEstelam}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-md transition duration-200"
                  >
                    {loading ? 'در حال استعلام...' : 'استعلام نام طرفین'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEstelam && estelamData && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
                نتیجه استعلام
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نام مبدا:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{estelamData.fromName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نام مقصد:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{estelamData.toName}</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-md transition duration-200"
                >
                  {loading ? 'در حال انتقال...' : 'ثبت انتقال'}
                </button>
                <button
                  onClick={() => {
                    setShowEstelam(false);
                    setEstelamData(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-md transition duration-200"
                >
                  بازگشت
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}