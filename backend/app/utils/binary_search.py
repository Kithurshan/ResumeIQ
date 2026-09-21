"""
binary_search.py — A simple, beginner-friendly Binary Search Algorithm
======================================================================
This file provides a reusable binary search function that can be used 
anywhere in your full system.

What is Binary Search?
Binary search is a super fast way to find an item in a SORTED list.
Imagine searching for a word in a dictionary: you don't read every page 
from the start. You open the middle, see if your word is earlier or 
later, and repeat. That's binary search!

Rules:
- The list MUST be sorted before you use this function!
"""

def binary_search(sorted_list, target, key=lambda x: x):
    """
    Finds the 'target' in a 'sorted_list'.
    
    Parameters:
    - sorted_list: A list of items (must be sorted!).
    - target: The value you are looking for.
    - key: An optional function to extract the value you want to compare.
           (Very useful if you are searching a list of dictionaries).
           
    Returns:
    - The exact index (position) of the item if found.
    - Returns -1 if the item is not in the list.
    """
    left = 0                                  # Start of the list
    right = len(sorted_list) - 1              # End of the list
    
    while left <= right:
        # 1. Find the middle item
        mid = (left + right) // 2
        
        # Get the value to compare (using the key function if provided)
        mid_value = key(sorted_list[mid])
        
        # 2. Check if we found it!
        if mid_value == target:
            return mid
            
        # 3. If target is bigger, it must be in the right half
        elif mid_value < target:
            left = mid + 1
            
        # 4. If target is smaller, it must be in the left half
        else:
            right = mid - 1
            
    # We looked everywhere and didn't find it
    return -1
