import math

radius = 5

# Correct calculation
correct_area = math.pi * radius ** 2
print(f"Correct calculation: A = π × {radius}² = {correct_area:.5f}")
print()

# Common mistakes and their results
mistakes = [
    ("Using diameter instead of radius", math.pi * (radius * 2) ** 2, "π × (2r)² = π × 100 = 100π"),
    ("Using π² instead of π", (math.pi ** 2) * radius ** 2, "π² × r²"),
    ("Using 3.14 instead of more precise π", 3.14 * radius ** 2, "3.14 × 25 = 78.5"),
    ("Forgetting to square the radius", math.pi * radius, "π × r = 5π ≈ 15.71"),
    ("Squaring π instead of the radius", math.pi * (math.pi ** 2), "π × π² = π³"),
    ("Using formula A = 2πr (circumference formula)", 2 * math.pi * radius, "2πr = circumference"),
    ("Using formula A = πr (mixing formulas)", math.pi * radius, "πr"),
    ("Calculation order error", (math.pi * radius) ** 2, "(πr)² instead of πr²"),
    ("Using degrees instead of radians", math.pi * (radius * math.pi/180) ** 2, "Converting to degrees unnecessarily"),
]

print("Common mistakes and their results:")
for i, (description, result, formula) in enumerate(mistakes, 1):
    print(f"{i}. {description}:")
    print(f"   Formula: {formula}")
    print(f"   Result: {result:.5f}")
    print(f"   Error: {abs(result - correct_area):.5f} units²")
    print()