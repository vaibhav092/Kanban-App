import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import Card from './Card'

const Column = ({ column, cards, onAddCard }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    })

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 w-80 flex-shrink-0 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg">
                    {column.name}
                </h3>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {cards.length} {cards.length === 1 ? 'task' : 'tasks'}
                    </span>
                </div>
            </div>

            <div ref={setNodeRef} className="min-h-[300px] mb-4">
                <SortableContext
                    items={cards.map((card) => card.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {cards
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((card) => (
                                <Card key={card.id} card={card} />
                            ))}
                    </div>
                </SortableContext>
            </div>

            <button
                onClick={onAddCard}
                className="w-full px-4 py-3 text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2 group"
            >
                <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
                <span>Add a task</span>
            </button>
        </div>
    )
}

export default Column
