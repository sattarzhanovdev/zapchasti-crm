import React from 'react'
import c from './add.module.scss'
import { Icons } from '../../assets/icons'

const emptyRow = {
  name: '',
  quantity: '',
  price: '',
  category: '',
  price_seller: '',
  code: '',
  unit: 'шт',
  fixed_quantity: ''
}

const AddStock = ({ setActive, selectedBranch }) => {
  const [rows, setRows] = React.useState([emptyRow])
  const [categories, setCategories] = React.useState([])

  const branchAPI = 'http://127.0.0.1:8000/'

  const handleChange = (index, field, value) => {
    setRows(prev =>
      prev.map((row, i) => {
        if (i !== index) return row
        if (field === 'quantity') {
          return {
            ...row,
            quantity: value,
            fixed_quantity: row.fixed_quantity || value
          }
        }
        return { ...row, [field]: value }
      })
    )
  }

  const addRow = () => setRows(prev => [...prev, emptyRow])

  const handleSave = async () => {
    const payload = rows.map(item => ({
      name: item.name,
      code: item.code.split(',').map(c => c.trim()).filter(Boolean),
      quantity: +item.quantity || 0,
      price: +item.price || 0,
      price_seller: +item.price_seller || 0,
      unit: item.unit || 'шт',
      fixed_quantity: +item.fixed_quantity || +item.quantity || 0,
      category_id: +item.category || null
    }))

    try {
      const res = await fetch(`${branchAPI}/clients/stocks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.status === 201 || res.status === 200) {
        alert('Товары успешно добавлены')
        setActive(false)
        window.location.reload()
      } else {
        alert('Ошибка при сохранении товара')
      }
    } catch (err) {
      console.error('Ошибка при сохранении товара:', err)
    }
  }

  React.useEffect(() => {
    fetch(`${branchAPI}/clients/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Не удалось загрузить категории:', err))
  }, [branchAPI])

  return (
    <div className={c.addExpense}>
      <div className={c.addExpense__header}>
        <h2>Добавление товара</h2>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className={c.addExpense__form}>
          <div className={c.addExpense__form__item}>
            <label htmlFor={`code-${idx}`}>Код</label>
            <input
              id={`code-${idx}`}
              value={row.code}
              placeholder="Код товара (через запятую)"
              onChange={e => handleChange(idx, 'code', e.target.value)}
            />
          </div>

          <div className={c.addExpense__form__item}>
            <label htmlFor={`name-${idx}`}>Наименование</label>
            <input
              id={`name-${idx}`}
              value={row.name}
              placeholder="Введите наименование"
              onChange={e => handleChange(idx, 'name', e.target.value)}
            />
          </div>

          <div className={c.addExpense__form__item}>
            <label htmlFor={`cat-${idx}`}>Категория</label>
            <select
              id={`cat-${idx}`}
              value={row.category}
              onChange={e => handleChange(idx, 'category', e.target.value)}
            >
              <option value="">‒ выберите ‒</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className={c.addExpense__form__item}>
            <label htmlFor={`qty-${idx}`}>Количество</label>
            <input
              id={`qty-${idx}`}
              type="number"
              value={row.quantity}
              placeholder="0"
              onChange={e => handleChange(idx, 'quantity', e.target.value)}
            />
          </div>

          <div className={c.addExpense__form__item}>
            <label htmlFor={`ps-${idx}`}>Цена поставщика</label>
            <input
              id={`ps-${idx}`}
              type="number"
              value={row.price_seller}
              placeholder="0"
              onChange={e => handleChange(idx, 'price_seller', e.target.value)}
            />
          </div>

          <div className={c.addExpense__form__item}>
            <label htmlFor={`pr-${idx}`}>Цена продажи</label>
            <input
              id={`pr-${idx}`}
              type="number"
              value={row.price}
              placeholder="0"
              onChange={e => handleChange(idx, 'price', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button onClick={addRow}>
        <img src={Icons.plus} alt="" /> Добавить строку
      </button>

      <div className={c.res}>
        <button onClick={() => setActive(false)}>Отменить</button>
        <button onClick={handleSave}>
          <img src={Icons.addGreen} alt="" /> Сохранить
        </button>
      </div>
    </div>
  )
}

export default AddStock