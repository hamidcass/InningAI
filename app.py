import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from data_prep import prep_b_data
from train_models import pipeline 

st.set_page_config(page_title="MLB Performance Projections", layout="wide", page_icon="⚾")

# Title
st.title("⚾ MLB Performance Projections")
st.markdown("---")

# Horizontal configuration bar
col1, col2, col3, col4, col5 = st.columns([2, 2, 2, 1, 2])

with col1:
    target_stat = st.selectbox(
        "Target Stat",
        ["OPS", "HR", "AVG", "wRC+"],
        key="target_stat"
    )

with col2:
    model_choice = st.selectbox(
        "Model",
        ["XGBoost", "Random Forest", "Ridge Regression", "Linear Regression"],
        key="model"
    )
#TODO: make this affect data (it is a dud rn)

with col3:
    year_range = st.select_slider(
        "Training Years",
        options=list(range(2020, 2025)),
        value=(2020, 2024),
        key="years"
    )

with col4:
    st.write("")  # Spacing
    st.write("")  # Spacing

with col5:
    st.write("")  # Spacing
    run_button = st.button("Run Predictions", type="primary", use_container_width=True)

st.markdown("---")

# Results section
if run_button or 'results' in st.session_state:
    if run_button:
        # TODO: Run your model predictions here
        # For now, using placeholder data

        #send target stat to prep file to get new df of appropriate features
        df = prep_b_data.run(target_stat)
        
        #now that we have the df with correct features, send to pipeline
        mae, r2, num_players, results_df = pipeline.run(df, target_stat, model_choice, year_range)

        st.session_state.results = {
            'mae': mae,
            'r2': r2,
            'num_players': num_players
        }
    
    # Metrics row
    st.subheader(f"{year_range[1]+1} {target_stat} Predictions - {model_choice}")
    
    metric_col1, metric_col2, metric_col3 = st.columns(3)
    with metric_col1:
        st.metric("MAE", f"{st.session_state.results['mae']:.4f}")
    with metric_col2:
        st.metric("R²", f"{st.session_state.results['r2']:.3f}")
    with metric_col3:
        st.metric("Players", st.session_state.results['num_players'])
    
    st.markdown("")
    
    # Tabs for different views
    tab1, tab2, tab3 = st.tabs(["📊 Overview", "🔍 Player Search", "🎯 Feature Analysis"])
    
    with tab1:
        st.subheader("Predicted vs Actual Performance")
        
        # # TODO: Replace with your actual scatter plot
        # # Placeholder visualization
        # dummy_data = pd.DataFrame({
        #     'Actual': np.random.uniform(0.5, 1.1, 100),
        #     'Predicted': np.random.uniform(0.6, 1.0, 100)
        # })

        #use plot data for visualizations
        
        fig = px.scatter(
            results_df, 
            x='Actual', 
            y='Predicted',
            hover_data={
                'Player': True,
                f'{year_range[1]+1} Team': True,
                'Actual': ':.3f',
                'Predicted': ':.3f'
    },
            title=f"Projected vs Actual {target_stat}",
            labels={'Actual': f'Actual {target_stat}', 'Projected': f'Projected {target_stat}'}
        )
        
        def get_scale():
                if target_stat == "AVG":
                    return [0.15, 0.35]
                elif target_stat == "HR":
                    return [0, 65]
                elif target_stat == "OPS":
                    return [0.5, 1.2]
                elif target_stat == "wRC+":
                    return [20, 180]

        # Add perfect prediction line
        fig.add_trace(go.Scatter(
            #TODO: change scale based on stat
            
                
            x=get_scale(),
            y=get_scale(),
            mode='lines',
            name='Perfect Prediction',
            line=dict(color='red', dash='dash')
        ))

        #TODO: Add model trend line
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Top/Bottom performers

        #apply colours
        def colour_cells(value):
            if value < 0: #underperformane
                color = "red"
            elif value > 0:
                color = "green"
            else:
                color = ""
            return f"background-color: {color}"

        col_a, col_b = st.columns(2)
        with col_a:
            st.markdown("**🔥 Top 5 Overperformers**")

            overperformers = (
                results_df[results_df['Error'] < 0]
                .head(5)[['Player', 'Predicted', 'Actual', 'Error']]
                .copy()
            )

            styled = overperformers.style.applymap(
                colour_cells, subset=["Error"]
            )
            
            #limit to appropriate decimal place for stat
            if target_stat in ['OPS', 'AVG', 'wRC+']:
                styled = styled.format({
                    "Predicted": "{:.3f}",
                    "Actual": "{:.3f}",
                    "Error": "{:.3f}",
                })
            else:  # HR, counting stats
                styled = styled.format({
                    "Predicted": "{:.0f}",
                    "Actual": "{:.0f}",
                    "Error": "{:.0f}",
                })

            st.dataframe(styled, hide_index=True)

        with col_b:
            st.markdown("**📉 Top 5 Underperformers**")

            underperformers = (
                results_df[results_df['Error'] > 0]
                .head(5)[['Player', 'Predicted', 'Actual', 'Error']]
                .copy()
            )

            styled = underperformers.style.applymap(
                colour_cells, subset=["Error"]
            )

            if target_stat in ['OPS', 'AVG', 'wRC+']:
                styled = styled.format({
                    "Predicted": "{:.3f}",
                    "Actual": "{:.3f}",
                    "Error": "{:.3f}",
                })
            else:  # HR, counting stats
                styled = styled.format({
                    "Predicted": "{:.0f}",
                    "Actual": "{:.0f}",
                    "Error": "{:.0f}",
                })

            st.dataframe(styled, hide_index=True)
            
    with tab2:
        st.subheader("Player Search")
        
        player_search = st.text_input("🔍 Search for a player...", placeholder="e.g., Shohei Ohtani")
        
        if player_search:
            st.markdown(f"### Results for: {player_search}")
            
            # Player card
            card_col1, card_col2, card_col3 = st.columns([1, 1, 1])
            
            with card_col1:
                st.metric("Predicted OPS", "0.875")
            with card_col2:
                st.metric("Actual OPS", "0.921", delta="+0.046")
            with card_col3:
                st.metric("Confidence", "85%")
            
            # TODO: Add player-specific visualizations (radar chart, trend line, etc.)
            st.info("Player detail visualizations coming soon...")
        else:
            st.info("👆 Enter a player name to see detailed predictions")
    
    with tab3:
        st.subheader("Feature Importance Analysis")
        
        # TODO: Replace with actual feature importance from your model
        feature_data = pd.DataFrame({
            'Feature': ['Current_xwOBA', 'Next_Team_BOS', 'Next_Team_HOU', 'Current_PA', 'Current_HardHit%'],
            'Importance': [0.063, 0.036, 0.035, 0.028, 0.026]
        })
        
        fig_features = px.bar(
            feature_data,
            x='Importance',
            y='Feature',
            orientation='h',
            title=f"Top Features for {target_stat} Prediction ({model_choice})"
        )
        
        st.plotly_chart(fig_features, use_container_width=True)
        
        # Key insights
        st.markdown("### 💡 Key Insights")
        st.markdown("""
        - **xwOBA** is the strongest predictor of future OPS
        - **Team effects** account for significant variance
        - **Plate appearances** indicate playing time and sample size
        """)

else:
    # Initial state - show instruction
    #st.info("👆 Configure your prediction settings and click **Run Predictions** to start")
    st.info("Machine learning meets baseball. Predict 2025 player stats using 4 years of data, advanced metrics, and ensemble ML models." \
    "👆 Configure your prediction settings and click **Run Predictions** to start")
    
    # Show some quick stats about the dataset
    st.markdown("### 📊 Dataset Overview")
    
    quick_col1, quick_col2, quick_col3, quick_col4 = st.columns(4)
    with quick_col1:
        st.metric("Total Player-Seasons", "920")
    with quick_col2:
        st.metric("Years Covered", "2020-2024")
    with quick_col3:
        st.metric("Models Available", "4")
    with quick_col4:
        st.metric("Stats Predicted", "4")