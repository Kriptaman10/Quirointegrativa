'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestConnection() {
    const [status, setStatus] = useState('Verificando conexión...')

    useEffect(() => {
        async function checkConnection() {
            try {
                const { data, error } = await supabase
                    .from('pacientes')
                    .select('count(*)')
                
                if (error) throw error
                
                setStatus('¡Conexión exitosa! 🎉')
            } catch (error) {
                console.error('Error:', error)
                setStatus('Error de conexión ❌')
            }
        }

        checkConnection()
    }, [])

    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-bold mb-2">Estado de la conexión</h2>
            <p className={status.includes('exitosa') ? 'text-green-600' : 'text-red-600'}>
                {status}
            </p>
        </div>
    )
} 