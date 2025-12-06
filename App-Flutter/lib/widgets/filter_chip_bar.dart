import 'package:flutter/material.dart';

/// Barra de filtros com chips
class FilterChipBar extends StatelessWidget {
  final List<Map<String, dynamic>> filters;
  final String selectedFilter;
  final Function(String) onFilterChanged;

  const FilterChipBar({
    super.key,
    required this.filters,
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 45,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = selectedFilter == filter['value'];

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isSelected,
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    filter['icon'] as IconData,
                    size: 16,
                    color: isSelected ? Colors.white : const Color(0xFF135CE4),
                  ),
                  const SizedBox(width: 6),
                  Text(filter['label'] as String),
                ],
              ),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF135CE4),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF135CE4),
              checkmarkColor: Colors.white,
              showCheckmark: false,
              elevation: 2,
              pressElevation: 4,
              shadowColor: Colors.black26,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected
                      ? const Color(0xFF135CE4)
                      : Colors.grey[300]!,
                ),
              ),
              onSelected: (_) => onFilterChanged(filter['value'] as String),
            ),
          );
        },
      ),
    );
  }
}
