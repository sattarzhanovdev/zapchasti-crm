import React, { useEffect, useState } from 'react'
import c from './add.module.scss'
import { Icons } from '../../assets/icons'

const EditStock = ({ setActive, selectedBranch }) => {
  const initial = JSON.parse(localStorage.getItem('editStock'))

  const [code, setCode] = useState(initial.code || '')
  const [name, setName] = useState(initial.name || '')
  const [quantity, setQuantity] = useState(initial.quantity || '')
  const [price, setPrice] = useState(initial.price || '')
  const [priceSeller, setPriceSeller] = useState(initial.price_seller || '')
  const [category, setCategory] = useState(initial.category?.id || '')
  const [unit] = useState(initial.unit || 'шт')
  const [fixedQuantity, setFixedQuantity] = useState(
    initial.fixed_quantity ?? initial.quantity ?? 0
  )

  const [cats, setCats] = useState([])

  const branchAPI = 'https://zapchasticrm.pythonanywhere.com/'

  // Генератор EAN-13 штрихкода
  const getRandomBarcode = () => {
    const base = Math.floor(100000000000 + Math.random() * 900000000000).toString()
    const sum = base.split('').reduce((acc, digit, idx) => {
      const d = parseInt(digit, 10)
      return acc + d * (idx % 2 === 0 ? 1 : 3)
    }, 0)
    const checksum = (10 - (sum % 10)) % 10
    return base + checksum
  }

  const handleSave = async () => {
  try {
    let currentCode = code
    if (!currentCode.trim()) {
      currentCode = getRandomBarcode()
      setCode(currentCode)
    }

    const payload = {
      code: currentCode,
      name,
      quantity: +quantity || 0,
      price: +price || 0,
      price_seller: +priceSeller || 0,
      category_id: category || null,
      unit,
      fixed_quantity: +fixedQuantity || 0,
    }

    await fetch(`${branchAPI}/clients/stocks/${initial.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    alert('Товар сохранён')
    setActive(false)
    window.location.reload()
  } catch (err) {
    console.error('Ошибка при сохранении:', err)
    alert('Ошибка при сохранении')
  }
}

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return

    try {
      await fetch(`${branchAPI}/clients/stocks/${initial.id}/`, {
        method: 'DELETE'
      })

      alert('Товар удалён')
      setActive(false)
      window.location.reload()
    } catch (err) {
      console.error('Ошибка при удалении товара:', err)
      alert('Ошибка при удалении товара')
    }
  }

  useEffect(() => {
    fetch(`${branchAPI}/clients/categories/`)
      .then(res => res.json())
      .then(data => setCats(data))
      .catch(e => console.error('Не удалось загрузить категории', e))
  }, [branchAPI])

  useEffect(() => {
    if (!initial.code) {
      const generated = getRandomBarcode()
      setCode(generated)
    }
  }, [initial])

  return (
    <div className={c.addExpense}>
      <div className={c.addExpense__header}>
        <h2>Изменение товара</h2>
      </div>

      <div className={c.addExpense__form}>
        {/* код */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="code">Код</label>
          <input
            id="code"
            value={code}
            placeholder="Код товара"
            onChange={e => setCode(e.target.value)}
          />
        </div>

        {/* наименование */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="name">Наименование</label>
          <input
            id="name"
            value={name}
            placeholder="Введите наименование"
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* категория */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="cat">Категория</label>
          <select
            id="cat"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">‒ выберите ‒</option>
            {cats.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* количество */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="qty">Количество</label>
          <input
            id="qty"
            type="number"
            value={quantity}
            placeholder="0"
            onChange={e => setQuantity(e.target.value)}
          />
        </div>

        {/* фиксированное количество */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="fqty">Фиксированное количество</label>
          <input
            id="fqty"
            type="number"
            value={fixedQuantity}
            placeholder="0"
            onChange={e => setFixedQuantity(e.target.value)}
          />
        </div>

        {/* цена поставщика */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="ps">Цена поставщика</label>
          <input
            id="ps"
            type="number"
            value={priceSeller}
            placeholder="0"
            onChange={e => setPriceSeller(e.target.value)}
          />
        </div>

        {/* цена продажи */}
        <div className={c.addExpense__form__item}>
          <label htmlFor="pr">Цена продажи</label>
          <input
            id="pr"
            type="number"
            value={price}
            placeholder="0"
            onChange={e => setPrice(e.target.value)}
          />
        </div>
      </div>

      <div className={c.res}>
        <button onClick={() => setActive(false)}>Отменить</button>
        <button onClick={handleSave}>
          <img src={Icons.addGreen} alt="" /> Сохранить
        </button>
        {initial.id && (
          <button onClick={handleDelete}>Удалить</button>
        )}
      </div>
    </div>
  )
}

export default EditStock