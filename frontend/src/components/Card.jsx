import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const Card = ({ card, isDragging = false, onDeleteCard }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: card.id,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isSortableDragging ? 0.5 : 1,
    }

    if (!card) return null

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-700 hover:shadow-xl hover:border-blue-500 transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        >
            <div className="mb-4 flex items-start justify-between">
                <h4 className="font-semibold text-white text-sm leading-snug group-hover:text-blue-400 transition-colors duration-200">
                    {card.title}
                </h4>
                {onDeleteCard && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id) }}
                        className="text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded p-1"
                        title="Delete card"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.036-1.005 12.06A3.75 3.75 0 0 1 15.169 22H8.831a3.75 3.75 0 0 1-3.739-3.281L4.087 6.659l-.209.036a.75.75 0 1 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.197 51.197 0 0 1 3.272 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.61-1.428 1.364-1.452ZM8.78 8.72a.75.75 0 0 1 .807.687l.401 6.75a.75.75 0 1 1-1.494.089l-.401-6.75a.75.75 0 0 1 .687-.776Zm5.633 0a.75.75 0 0 1 .687.776l-.401 6.75a.75.75 0 1 1-1.494-.089l.401-6.75a.75.75 0 0 1 .807-.687Z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
            {card.description && (
                <p className="text-neutral-300 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {card.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                    {card.labels &&
                        JSON.parse(card.labels || '[]').length > 0 && (
                            <div className="flex gap-1">
                                {JSON.parse(card.labels || '[]')
                                    .slice(0, 2)
                                    .map((label, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-blue-900/30 text-blue-300 border border-blue-800 rounded-full text-xs font-medium"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                {JSON.parse(card.labels || '[]').length > 2 && (
                                    <span className="px-2 py-1 bg-neutral-700 text-white rounded-full text-xs font-medium">
                                        +
                                        {JSON.parse(card.labels || '[]')
                                            .length - 2}
                                    </span>
                                )}
                            </div>
                        )}
                </div>

                <div className="flex items-center space-x-2">
                    {card.assignee && (
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
                            {card.assignee.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
            </div>
        </div>
    )
}

export default Card
