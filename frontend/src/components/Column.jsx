import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import Card from './Card'

const Column = ({ column, cards, onAddCard, onDeleteColumn, onDeleteCard }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    })

    return (
        <div className="bg-neutral-900 rounded-2xl p-6 w-80 flex-shrink-0 border border-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg">
                    {column.name}
                </h3>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-neutral-300 bg-neutral-800 px-3 py-1 rounded-full">
                        {cards.length} {cards.length === 1 ? 'task' : 'tasks'}
                    </span>
                    <button
                        onClick={() => onDeleteColumn && onDeleteColumn(column.id)}
                        className="ml-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded p-1"
                        title="Delete column"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.036-1.005 12.06A3.75 3.75 0 0 1 15.169 22H8.831a3.75 3.75 0 0 1-3.739-3.281L4.087 6.659l-.209.036a.75.75 0 1 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.197 51.197 0 0 1 3.272 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.61-1.428 1.364-1.452ZM8.78 8.72a.75.75 0 0 1 .807.687l.401 6.75a.75.75 0 1 1-1.494.089l-.401-6.75a.75.75 0 0 1 .687-.776Zm5.633 0a.75.75 0 0 1 .687.776l-.401 6.75a.75.75 0 1 1-1.494-.089l.401-6.75a.75.75 0 0 1 .807-.687Z" clipRule="evenodd" />
                        </svg>
                    </button>
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
                                <Card key={card.id} card={card} onDeleteCard={onDeleteCard} />
                            ))}
                    </div>
                </SortableContext>
            </div>

            <button
                onClick={onAddCard}
                className="w-full px-4 py-3 text-white bg-neutral-800 border-2 border-dashed border-neutral-700 rounded-xl hover:border-blue-500 hover:bg-neutral-800/80 transition-all duration-200 font-medium flex items-center justify-center space-x-2 group"
            >
                <svg
                    className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200"
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
