import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const Card = ({ card, isDragging = false }) => {
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
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        >
            <div className="mb-4">
                <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors duration-200">
                    {card.title}
                </h4>
                {card.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {card.description}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {card.labels &&
                        JSON.parse(card.labels || '[]').length > 0 && (
                            <div className="flex gap-1">
                                {JSON.parse(card.labels || '[]')
                                    .slice(0, 2)
                                    .map((label, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs font-medium"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                {JSON.parse(card.labels || '[]').length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
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
                        <div className="w-7 h-7 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
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
