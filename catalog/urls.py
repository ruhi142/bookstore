from django.urls import path
from . import views

app_name = "catalog"

urlpatterns = [
    path("search/", views.search, name="search"),
    path("book/<str:book_id>/", views.book_detail, name="book_detail"),
    path("<slug:slug>/", views.category_listing, name="category_listing"),
]
