import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, Save, ChevronDown } from 'lucide-react';
import ContextProvider from '../contexts/ContextProvider';

// Компонент всплывающей панели AI ассистента
const AIAssistantPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [generationType, setGenerationType] = useState('text');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const messageEndRef = useRef(null);
  const { currentContext } = React.useContext(ContextProvider);
  
  // Типы генерации
  const generationTypes = [
    { id: 'text', name: 'Текст' },
    { id: 'script', name: 'Сценарий' },
    { id: 'template', name: 'Шаблон' },
    { id: 'analysis', name: 'Анализ' }
  ];

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Отправка сообщения ассистенту
  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    // Добавляем сообщение пользователя в чат
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Определяем эндпоинт в зависимости от типа генерации
      let endpoint;
      switch (generationType) {
        case 'text':
          endpoint = '/api/ai/generate/text';
          break;
        case 'script':
          endpoint = '/api/ai/generate/suggestions';
          break;
        case 'template':
          endpoint = '/api/ai/generate/templates';
          break;
        case 'analysis':
          endpoint = '/api/ai/analyze';
          break;
        default:
          endpoint = '/api/ai/generate/text';
      }

      // Отправляем запрос к API с контекстом
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: currentContext,
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      const data = await response.json();

      // Добавляем ответ ассистента в чат
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.message,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        generationType,
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      // Добавляем сообщение об ошибке
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Произошла ошибка при получении ответа. Пожалуйста, попробуйте еще раз.',
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Функция для вставки сгенерированного контента
  const handleInsertContent = async (content) => {
    try {
      // Здесь будет логика вставки в активный блок
      // в зависимости от текущего активного компонента
      console.log('Вставка контента:', content);
      
      // Пример вызова API для вставки
      await fetch('/api/content/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          blockType: currentContext.activeBlockType || 'text'
        }),
      });
      
      // Оповещение о успешной вставке
      const notificationMessage = {
        id: Date.now(),
        text: 'Контент успешно вставлен',
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, notificationMessage]);
    } catch (error) {
      console.error('Ошибка при вставке контента:', error);
    }
  };

  // Сохранение диалога
  const handleSaveDialog = async () => {
    try {
      const response = await fetch('/api/ai/history/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context: currentContext
        }),
      });
      
      const result = await response.json();
      
      // Оповещение о успешном сохранении
      const saveMessage = {
        id: Date.now(),
        text: 'Диалог успешно сохранен',
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, saveMessage]);
    } catch (error) {
      console.error('Ошибка при сохранении диалога:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg h-[600px] flex flex-col">
        {/* Заголовок панели */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">AI Ассистент</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDialog}
              className="p-1 rounded hover:bg-gray-100"
              title="Сохранить диалог"
            >
              <Save size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
              title="Закрыть"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Начните диалог с AI ассистентом
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : message.sender === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  
                  {/* Дополнительные действия для сообщений ассистента */}
                  {message.sender === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={() => handleInsertContent(message.text)}
                        className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        <Plus size={12} className="mr-1" /> Вставить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>
        
        {/* Панель выбора типа генерации */}
        <div className="px-4 py-2 border-t relative">
          <div
            className="flex items-center cursor-pointer text-sm text-gray-600 mb-2"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
          >
            <span>Тип: {generationTypes.find(t => t.id === generationType)?.name}</span>
            <ChevronDown size={14} className="ml-1" />
          </div>
          
          {showTypeSelector && (
            <div className="absolute bottom-full left-4 bg-white border rounded shadow-lg">
              {generationTypes.map(type => (
                <div
                  key={type.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setGenerationType(type.id);
                    setShowTypeSelector(false);
                  }}
                >
                  {type.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Поле ввода */}
        <div className="border-t px-4 py-3 flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1 outline-none text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            className={`ml-2 p-2 rounded-full ${
              loading || !inputValue.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
